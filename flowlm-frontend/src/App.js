import React, { useCallback, useEffect, useMemo, useState } from "react";
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

function App() {
  const [prompts, setPrompts] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [selectedPromptVersionId, setSelectedPromptVersionId] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [selectedExperimentId, setSelectedExperimentId] = useState("");
  const [runs, setRuns] = useState([]);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    const [promptRes, datasetRes, experimentRes] = await Promise.all([
      getPrompts(),
      getDatasets(),
      getExperiments()
    ]);

    setPrompts(promptRes.data);
    setDatasets(datasetRes.data);
    setExperiments(experimentRes.data);

    const firstVersion = promptRes.data.flatMap((prompt) => prompt.versions)[0];
    const firstDataset = datasetRes.data[0];
    const firstExperiment = experimentRes.data[0];

    if (!selectedPromptVersionId && firstVersion) setSelectedPromptVersionId(firstVersion.id);
    if (!selectedDatasetId && firstDataset) setSelectedDatasetId(firstDataset.id);
    if (!selectedExperimentId && firstExperiment) setSelectedExperimentId(firstExperiment.experiment_id);
  }, [selectedDatasetId, selectedExperimentId, selectedPromptVersionId]);

  const loadRuns = async (experimentId) => {
    const res = await getRuns(experimentId);
    setRuns(res.data);
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!selectedExperimentId) return;
    loadRuns(selectedExperimentId);
    getStatus(selectedExperimentId).then((res) => setStatus(res.data)).catch(() => {});
  }, [selectedExperimentId]);

  const handleCreatePrompt = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const promptRes = await createPrompt(promptName, promptDescription);
      const variables = promptVariables.split(",").map((item) => item.trim()).filter(Boolean);
      const config = parseJson(promptConfig, {});
      const versionRes = await createPromptVersion(promptRes.data.id, {
        template: promptTemplate,
        variables,
        model: promptModel,
        config
      });

      setSelectedPromptVersionId(versionRes.data.id);
      setMessage("Prompt and version created.");
      await loadAll();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not create prompt.");
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
      const res = await runExperiment(selectedPromptVersionId, selectedDatasetId);
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
    const interval = setInterval(async () => {
      try {
        const statusRes = await getStatus(experimentId);
        setStatus(statusRes.data);

        if (["completed", "failed"].includes(statusRes.data.status)) {
          clearInterval(interval);
          setLoading(false);
          await loadRuns(experimentId);
          await loadAll();
          setMessage(statusRes.data.status === "completed" ? "Experiment completed." : "Experiment failed.");
        }
      } catch {
        clearInterval(interval);
        setLoading(false);
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
            <button type="submit" disabled={loading}>Create version</button>
          </div>
          <label>Name<input value={promptName} onChange={(e) => setPromptName(e.target.value)} /></label>
          <label>Description<input value={promptDescription} onChange={(e) => setPromptDescription(e.target.value)} /></label>
          <label>Template<textarea rows="5" value={promptTemplate} onChange={(e) => setPromptTemplate(e.target.value)} /></label>
          <div className="split">
            <label>Variables<input value={promptVariables} onChange={(e) => setPromptVariables(e.target.value)} /></label>
            <label>Model<input value={promptModel} onChange={(e) => setPromptModel(e.target.value)} /></label>
          </div>
          <label>Config JSON<textarea rows="3" value={promptConfig} onChange={(e) => setPromptConfig(e.target.value)} /></label>
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
        <div className="runsGrid">
          {runs.map((run) => (
            <article className="runCard" key={run.id}>
              <div className="runMeta">
                <strong>Score {formatScore(run.score)}</strong>
                <span>{run.id.slice(0, 8)}</span>
              </div>
              <pre>{JSON.stringify(run.input, null, 2)}</pre>
              <p>{run.output || "No output saved yet."}</p>
            </article>
          ))}
          {!runs.length && <p className="empty">Select an experiment and load runs to inspect outputs.</p>}
        </div>
      </section>
    </main>
  );
}

export default App;
