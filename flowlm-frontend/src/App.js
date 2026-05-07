import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Login from "./Login";
import ObservabilityDashboard from "./ObservabilityDashboard";
import Playground from "./Playground";
import {
  addDatasetItem,
  createDataset,
  createPrompt,
  createPromptVersion,
  getDatasets,
  getExperiments,
  getPrompts,
  getRuns,
  getStoredToken,
  getSummary,
  getStatus,
  runExperiment
} from "./api";

const defaultPromptTemplate = "Explain {topic} in two clear sentences.";
const defaultInputJson = '{\n  "topic": "Opportunity Cost (Economics)"\n}';
const defaultExpected =
  "The value of the next best alternative that you give up when you make a specific choice.";

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatScore(score) {
  if (score === null || score === undefined) return "No score";
  return Number(score).toFixed(2);
}

function formatLatency(latencyMs) {
  if (latencyMs === null || latencyMs === undefined) return "n/a";
  return `${Math.round(Number(latencyMs))} ms`;
}

function truncate(value, limit = 300) {
  if (!value) return "No output saved yet.";
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.detail || fallback;
}

function App() {
  const [activeView, setActiveView] = useState("workbench");
  const [token, setToken] = useState(() => getStoredToken());
  const [prompts, setPrompts] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [selectedPromptVersionId, setSelectedPromptVersionId] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [selectedExperimentId, setSelectedExperimentId] = useState("");
  const [runs, setRuns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const [promptName, setPromptName] = useState("Teaching prompt");
  const [promptDescription, setPromptDescription] = useState("Short educational answers");
  const [promptTemplate, setPromptTemplate] = useState(defaultPromptTemplate);
  const [promptVariables, setPromptVariables] = useState("topic");
  const [promptModel, setPromptModel] = useState("openai/gpt-4o-mini");
  const [promptConfig, setPromptConfig] = useState('{\n  "max_tokens": 150\n}');

  const [datasetName, setDatasetName] = useState("Economics basics");
  const [datasetDescription, setDatasetDescription] = useState("Small evaluation set");
  const [itemInput, setItemInput] = useState(defaultInputJson);
  const [expectedOutput, setExpectedOutput] = useState(defaultExpected);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      return;
    }
    localStorage.removeItem("token");
  }, [token]);

  const promptVersions = useMemo(
    () => prompts.flatMap((prompt) => prompt.versions.map((version) => ({
      ...version,
      prompt_name: prompt.name
    }))),
    [prompts]
  );
  const promptVersionMap = useMemo(
    () => Object.fromEntries(promptVersions.map((version) => [version.id, version])),
    [promptVersions]
  );
  const selectedPromptVersion = selectedPromptVersionId ? promptVersionMap[selectedPromptVersionId] : null;
  const averageLatencyMs = useMemo(() => {
    const latencyValues = runs
      .map((run) => run.latency_ms)
      .filter((latency) => latency !== null && latency !== undefined);

    if (!latencyValues.length) return null;

    return latencyValues.reduce((total, latency) => total + latency, 0) / latencyValues.length;
  }, [runs]);
  const singleVersionModel = useMemo(() => {
    const promptVersionId = summary?.versions?.length === 1 ? summary.versions[0].prompt_version_id : null;
    return promptVersionId ? promptVersionMap[promptVersionId]?.model : null;
  }, [promptVersionMap, summary]);

  const handleApiError = useCallback((error, fallback) => {
    if (error.response?.status === 401) {
      setToken("");
      setMessage("Session expired. Please log in again.");
      return;
    }

    setMessage(getErrorMessage(error, fallback));
  }, []);

  const loadAll = useCallback(async () => {
    if (!token) return;

    try {
      const [promptRes, datasetRes, experimentRes] = await Promise.all([
        getPrompts(),
        getDatasets(),
        getExperiments()
      ]);

      const sortedExperiments = [...experimentRes.data].sort(
        (a, b) => (b.avg_score || 0) - (a.avg_score || 0)
      );

      setPrompts(promptRes.data);
      setDatasets(datasetRes.data);
      setExperiments(sortedExperiments);

      const firstPrompt = promptRes.data[0];
      const firstVersion = promptRes.data.flatMap((prompt) => prompt.versions)[0];
      const firstDataset = datasetRes.data[0];
      const firstExperiment = sortedExperiments[0];

      if (!selectedPromptId && firstPrompt) setSelectedPromptId(firstPrompt.id);
      if (!selectedPromptVersionId && firstVersion) setSelectedPromptVersionId(firstVersion.id);
      if (!selectedDatasetId && firstDataset) setSelectedDatasetId(firstDataset.id);
      if (!selectedExperimentId && firstExperiment) setSelectedExperimentId(firstExperiment.experiment_id);
    } catch (error) {
      handleApiError(error, "Could not load dashboard data.");
    }
  }, [
    handleApiError,
    selectedDatasetId,
    selectedExperimentId,
    selectedPromptId,
    selectedPromptVersionId,
    token
  ]);

  const loadRuns = useCallback(async (experimentId) => {
    try {
      const [runsRes, summaryRes] = await Promise.all([
        getRuns(experimentId),
        getSummary(experimentId)
      ]);

      setRuns(runsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      setRuns([]);
      setSummary(null);
      handleApiError(error, "Could not load experiment runs.");
    }
  }, [handleApiError]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!selectedExperimentId) return;
    loadRuns(selectedExperimentId);
    getStatus(selectedExperimentId)
      .then((res) => setStatus(res.data))
      .catch((error) => handleApiError(error, "Could not load experiment status."));
  }, [handleApiError, loadRuns, selectedExperimentId]);

  useEffect(() => () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const handleCreatePrompt = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const promptRes = await createPrompt(promptName, promptDescription);
      setMessage("Prompt created.");
      await loadAll();
      setSelectedPromptId(promptRes.data.id);
    } catch (error) {
      handleApiError(error, "Could not create prompt.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromptVersion = async () => {
    if (!selectedPromptId) {
      setMessage("Create or select a prompt first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const variables = promptVariables.split(",").map((item) => item.trim()).filter(Boolean);
      const config = parseJson(promptConfig, {});
      const versionRes = await createPromptVersion(selectedPromptId, {
        template: promptTemplate,
        variables,
        model: promptModel,
        config
      });

      setMessage("Prompt version created.");
      await loadAll();
      setSelectedPromptVersionId(versionRes.data.id);
    } catch (error) {
      handleApiError(error, "Could not create prompt version.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDataset = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const datasetRes = await createDataset({
        name: datasetName,
        description: datasetDescription
      });

      setSelectedDatasetId(datasetRes.data.id);
      setMessage("Dataset created.");
      await loadAll();
    } catch (error) {
      handleApiError(error, "Could not create dataset.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (event) => {
    event.preventDefault();
    if (!selectedDatasetId) {
      setMessage("Create or select a dataset first.");
      return;
    }

    const input = parseJson(itemInput, null);
    if (!input || Array.isArray(input)) {
      setMessage("Dataset item input must be a JSON object.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await addDatasetItem(selectedDatasetId, {
        input,
        expected_output: expectedOutput || null
      });
      setMessage("Dataset item added.");
      await loadAll();
    } catch (error) {
      handleApiError(error, "Could not add dataset item.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunExperiment = async () => {
    if (!selectedPromptVersionId || !selectedDatasetId) {
      setMessage("Select a prompt version and dataset first.");
      return;
    }

    setLoading(true);
    setMessage("Experiment queued.");

    try {
      const res = await runExperiment([selectedPromptVersionId], selectedDatasetId);
      const experimentId = res.data.experiment_id;
      setSelectedExperimentId(experimentId);
      setStatus(res.data);
      pollExperiment(experimentId);
    } catch (error) {
      handleApiError(error, "Could not queue experiment. Is Redis/Celery running?");
      setLoading(false);
    }
  };

  const pollExperiment = (experimentId) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const statusRes = await getStatus(experimentId);
        setStatus(statusRes.data);

        if (["completed", "failed"].includes(statusRes.data.status)) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setLoading(false);
          await loadRuns(experimentId);
          await loadAll();
          setMessage(statusRes.data.status === "completed" ? "Experiment completed." : "Experiment failed.");
        }
      } catch (error) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setLoading(false);
        handleApiError(error, "Could not poll experiment status.");
      }
    }, 2000);
  };

  const maxScore = Math.max(...experiments.map((exp) => exp.avg_score || 0), 1);

  const handleLogin = (value) => {
    if (typeof value === "string") {
      setToken(value);
      return;
    }

    if (value && typeof value === "object") {
      const nextToken = value.token || value.access_token || "";
      setToken(nextToken);
    }
  };

  const handleLogout = () => {
    setActiveView("workbench");
    setToken("");
    setPrompts([]);
    setDatasets([]);
    setExperiments([]);
    setRuns([]);
    setSummary(null);
    setStatus(null);
    setMessage("");
  };

  const getScrollableSelectProps = (optionCount) => ({
    style: {
      maxHeight: 220,
      overflowY: "auto"
    },
    onFocus: (event) => {
      if (optionCount > 6) {
        event.target.size = 6;
      }
    },
    onBlur: (event) => {
      event.target.size = 1;
    }
  });

  if (!token) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16
        }}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          <Login onLogin={handleLogin} />
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <header
        className="topbar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--bg)",
          padding: "16px 0 12px",
          marginBottom: 16,
          borderBottom: "1px solid var(--line)"
        }}
      >
        <div>
          <p className="eyebrow">FlowLM workbench</p>
          <h1 className="eyebrowbo">Prompt, dataset, and experiment control</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className={activeView === "workbench" ? "primary" : ""}
            onClick={() => setActiveView("workbench")}
          >
            Workbench
          </button>
          <button
            type="button"
            className={activeView === "observability" ? "primary" : ""}
            onClick={() => setActiveView("observability")}
          >
            Observability
          </button>
          <button
            type="button"
            className={activeView === "playground" ? "primary" : ""}
            onClick={() => setActiveView("playground")}
          >
            Playground
          </button>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {message && <div className="notice">{message}</div>}

      {activeView === "workbench" && (
        <>
          <section className="grid">
            <form className="panel" onSubmit={handleCreatePrompt}>
              <div className="panelHeader">
                <h2>Prompt editor</h2>
                <button type="submit" disabled={loading}>Create prompt</button>
              </div>
              <label>Name<input value={promptName} onChange={(e) => setPromptName(e.target.value)} /></label>
              <label>Description<input value={promptDescription} onChange={(e) => setPromptDescription(e.target.value)} /></label>
              <div className="datasetSelect">
                <span>Active prompt</span>
                <select value={selectedPromptId} onChange={(e) => setSelectedPromptId(e.target.value)}>
                  <option value="">Select prompt</option>
                  {prompts.map((prompt) => (
                    <option key={prompt.id} value={prompt.id}>{prompt.name}</option>
                  ))}
                </select>
              </div>
              <label>Template<textarea rows="5" value={promptTemplate} onChange={(e) => setPromptTemplate(e.target.value)} /></label>
              <div className="split">
                <label>Variables<input value={promptVariables} onChange={(e) => setPromptVariables(e.target.value)} /></label>
                <label>Model<input value={promptModel} onChange={(e) => setPromptModel(e.target.value)} /></label>
              </div>
              <label>Config JSON<textarea rows="3" value={promptConfig} onChange={(e) => setPromptConfig(e.target.value)} /></label>
              <button type="button" onClick={handleCreatePromptVersion} disabled={loading}>Create version</button>
            </form>

            <form className="panel" onSubmit={handleCreateDataset}>
              <div className="panelHeader">
                <h2>Dataset editor</h2>
                <button type="submit" disabled={loading}>Create dataset</button>
              </div>
              <label>Name<input value={datasetName} onChange={(e) => setDatasetName(e.target.value)} /></label>
              <label>Description<input value={datasetDescription} onChange={(e) => setDatasetDescription(e.target.value)} /></label>
              <div className="datasetSelect">
                <span>Active dataset</span>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => {
                    setSelectedDatasetId(e.target.value);
                    e.target.size = 1;
                    e.target.blur();
                  }}
                  {...getScrollableSelectProps(datasets.length + 1)}
                >
                  <option value="">Select dataset</option>
                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                  ))}
                </select>
              </div>
              <label>Item input JSON<textarea rows="5" value={itemInput} onChange={(e) => setItemInput(e.target.value)} /></label>
              <label>Expected output<textarea rows="3" value={expectedOutput} onChange={(e) => setExpectedOutput(e.target.value)} /></label>
              <button type="button" onClick={handleAddItem} disabled={loading}>Add item</button>
            </form>
          </section>

          <section
            className="controlBand"
            style={{
              position: "sticky",
              top: 108,
              zIndex: 15,
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
            }}
          >
            <label>
              Prompt version
              <select
                value={selectedPromptVersionId}
                onChange={(e) => {
                  setSelectedPromptVersionId(e.target.value);
                  e.target.size = 1;
                  e.target.blur();
                }}
                {...getScrollableSelectProps(promptVersions.length + 1)}
              >
                <option value="">Select prompt version</option>
                {promptVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.prompt_name} / v{version.version} / {version.model}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Dataset
              <select
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  e.target.size = 1;
                  e.target.blur();
                }}
                {...getScrollableSelectProps(datasets.length + 1)}
              >
                <option value="">Select dataset</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.items.length} items)
                  </option>
                ))}
              </select>
            </label>
            <div className="statusBox">
              <span>Status</span>
              <strong>{status?.status || "idle"}</strong>
              {selectedPromptVersion?.model && <small>{selectedPromptVersion.model}</small>}
            </div>
            <button className="primary" onClick={handleRunExperiment} disabled={loading}>
              {loading ? "Working..." : "Run experiment"}
            </button>
          </section>
        </>
      )}

      {activeView === "observability" && (
        <ObservabilityDashboard
          experiments={experiments}
          selectedExperimentId={selectedExperimentId}
          setSelectedExperimentId={setSelectedExperimentId}
          loadAll={loadAll}
          maxScore={maxScore}
          summary={summary}
          promptVersionMap={promptVersionMap}
          formatScore={formatScore}
          formatLatency={formatLatency}
          averageLatencyMs={averageLatencyMs}
          loadRuns={loadRuns}
          runs={runs}
          singleVersionModel={singleVersionModel}
          truncate={truncate}
        />
      )}

      {activeView === "playground" && <Playground />}
    </main>
  );
}

export default App;
