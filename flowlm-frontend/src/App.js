import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  addDatasetItem,
  createDataset,
  createPrompt,
  createPromptVersion,
  getDatasets,
  getExperiments,
  getPrompts,
  getRuns,
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

function truncate(value, limit = 300) {
  if (!value) return "No output saved yet.";
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

function App() {
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

  const promptVersions = useMemo(
    () => prompts.flatMap((prompt) => prompt.versions.map((version) => ({
      ...version,
      prompt_name: prompt.name
    }))),
    [prompts]
  );

  const loadAll = useCallback(async () => {
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
      setMessage(error.response?.data?.detail || "Could not load dashboard data.");
    }
  }, [selectedDatasetId, selectedExperimentId, selectedPromptId, selectedPromptVersionId]);

  const loadRuns = async (experimentId) => {
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
      setMessage(error.response?.data?.detail || "Could not load experiment runs.");
    }
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!selectedExperimentId) return;
    loadRuns(selectedExperimentId);
    getStatus(selectedExperimentId)
      .then((res) => setStatus(res.data))
      .catch((error) => setMessage(error.response?.data?.detail || "Could not load experiment status."));
  }, [selectedExperimentId]);

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
      setMessage(error.response?.data?.detail || "Could not create prompt.");
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
      setMessage(error.response?.data?.detail || "Could not create prompt version.");
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
      setMessage(error.response?.data?.detail || "Could not create dataset.");
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
      setMessage(error.response?.data?.detail || "Could not add dataset item.");
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
      setMessage(error.response?.data?.detail || "Could not queue experiment. Is Redis/Celery running?");
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
        setMessage(error.response?.data?.detail || "Could not poll experiment status.");
      }
    }, 2000);
  };

  const maxScore = Math.max(...experiments.map((exp) => exp.avg_score || 0), 1);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">FlowLM workbench</p>
          <h1>Prompt, dataset, and experiment control</h1>
        </div>
        <button className="primary" onClick={handleRunExperiment} disabled={loading}>
          {loading ? "Working..." : "Run experiment"}
        </button>
      </header>

      {message && <div className="notice">{message}</div>}

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
            <select value={selectedDatasetId} onChange={(e) => setSelectedDatasetId(e.target.value)}>
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

      <section className="controlBand">
        <label>
          Prompt version
          <select value={selectedPromptVersionId} onChange={(e) => setSelectedPromptVersionId(e.target.value)}>
            <option value="">Select prompt version</option>
            {promptVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.prompt_name} / v{version.version}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dataset
          <select value={selectedDatasetId} onChange={(e) => setSelectedDatasetId(e.target.value)}>
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
        </div>
      </section>

      <section className="grid lower">
        <div className="panel">
          <div className="panelHeader">
            <h2>Experiments</h2>
            <button type="button" onClick={loadAll}>Refresh</button>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Experiment</th>
                  <th>Runs</th>
                  <th>Avg score</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => (
                  <tr
                    key={exp.experiment_id}
                    className={selectedExperimentId === exp.experiment_id ? "selected" : ""}
                    onClick={() => setSelectedExperimentId(exp.experiment_id)}
                  >
                    <td>{exp.experiment_id.slice(0, 8)}</td>
                    <td>{exp.num_runs || 0}</td>
                    <td>{formatScore(exp.avg_score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2>Score trends</h2>
          <div className="chart">
            {experiments.slice(0, 8).reverse().map((exp) => (
              <button
                key={exp.experiment_id}
                className="bar"
                style={{ height: `${Math.max(((exp.avg_score || 0) / maxScore) * 100, 6)}%` }}
                onClick={() => setSelectedExperimentId(exp.experiment_id)}
                title={`${exp.experiment_id}: ${formatScore(exp.avg_score)}`}
              >
                <span>{formatScore(exp.avg_score)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel runsPanel">
        <div className="panelHeader">
          <h2>Detailed runs</h2>
          <button type="button" onClick={() => selectedExperimentId && loadRuns(selectedExperimentId)}>
            Load runs
          </button>
        </div>
        {summary?.winner && (
          <div className="winnerBox">
            <h2>Winner</h2>
            <p>Version: {summary.winner.prompt_version_id}</p>
            <p>Score: {formatScore(summary.winner.avg_score)}</p>
          </div>
        )}
        {summary?.saved_winner && (
          <div style={{ marginTop: 10 }}>
            <strong>Saved Winner:</strong> {summary.saved_winner}
          </div>
        )}
        {summary?.versions?.length > 0 && (
          <div className="tableWrap summaryTable">
            <table>
              <thead>
                <tr>
                  <th>Prompt version</th>
                  <th>Runs</th>
                  <th>Avg score</th>
                </tr>
              </thead>
              <tbody>
                {summary.versions.map((version) => {
                  const isWinner =
                    summary?.winner?.prompt_version_id === version.prompt_version_id;

                  return (
                    <tr
                      key={version.prompt_version_id}
                      className={isWinner ? "winnerRow" : ""}
                    >
                      <td>
                        {version.prompt_version_id}
                        {isWinner && <span className="winnerMark"> Winner</span>}
                      </td>
                      <td>{version.num_runs}</td>
                      <td>{formatScore(version.avg_score)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="runsGrid">
          {runs.map((run) => (
            <article className="runCard" key={run.id}>
              <div className="runMeta">
                <strong>Score {formatScore(run.score)}</strong>
                <span>{run.id.slice(0, 8)}</span>
              </div>
              <pre>{JSON.stringify(run.input, null, 2)}</pre>
              <p>{truncate(run.output)}</p>
            </article>
          ))}
          {!runs.length && <p className="empty">Select an experiment and load runs to inspect outputs.</p>}
        </div>
      </section>
    </main>
  );
}

export default App;
