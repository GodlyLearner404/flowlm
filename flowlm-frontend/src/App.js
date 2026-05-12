import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import DashboardLayout from "./components/Layout/DashboardLayout";
import AnalyticsPage from "./components/pages/AnalyticsPage";
import DashboardPage from "./components/pages/DashboardPage";
import DatasetsPage from "./components/pages/DatasetsPage";
import DeploymentsPage from "./components/pages/DeploymentsPage";
import ExperimentsPage from "./components/pages/ExperimentsPage";
import PlaygroundPage from "./components/pages/PlaygroundPage";
import PromptsPage from "./components/pages/PromptsPage";
import MetricCard from "./components/UI/MetricCard";
import Login from "./Login";
import ObservabilityDashboard from "./ObservabilityDashboard";
import {
  addDatasetItem,
  createDataset,
  createPrompt,
  createPromptVersion,
  getDatasets,
  getExperiments,
  getProjects,
  getPrompts,
  getRuns,
  getStatus,
  getStoredToken,
  getSummary,
  runExperiment
} from "./api";

const defaultPromptTemplate = "Explain {topic} in two clear sentences.";
const defaultInputJson = '{\n  "topic": "Opportunity Cost (Economics)"\n}';
const defaultExpected =
  "The value of the next best alternative that you give up when you make a specific choice.";
const activeProjectStorageKey = "activeProjectId";

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

function formatErrorDetail(detail, fallback) {
  if (!detail) return fallback;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return null;

        const location = Array.isArray(item.loc) ? item.loc.join(" > ") : item.loc;
        const message = item.msg || item.message;

        if (location && message) {
          return `${location}: ${message}`;
        }

        return message || null;
      })
      .filter(Boolean);

    return messages.length ? messages.join("; ") : fallback;
  }

  if (typeof detail === "object") {
    return detail.msg || detail.message || fallback;
  }

  return fallback;
}

function getErrorMessage(error, fallback) {
  return formatErrorDetail(error.response?.data?.detail, fallback);
}

const navigationItems = [
  { id: "workbench", label: "Dashboard", subtitle: "Overview" },
  { id: "projects", label: "Projects", subtitle: "Coming soon" },
  { id: "prompts", label: "Prompts", subtitle: "Versions" },
  { id: "datasets", label: "Datasets", subtitle: "Benchmarks" },
  { id: "experiments", label: "Experiments", subtitle: "Execution" },
  { id: "deployments", label: "Deployments", subtitle: "Release ops" },
  { id: "observability", label: "Analytics", subtitle: "Insights" },
  { id: "evaluations", label: "Evaluations", subtitle: "Coming soon" },
  { id: "playground", label: "Playground", subtitle: "Testing" },
  { id: "api-keys", label: "API Keys", subtitle: "Coming soon" },
  { id: "settings", label: "Settings", subtitle: "Coming soon" }
];

const viewMeta = {
  workbench: {
    title: "Dashboard",
    subtitle: "Operational overview across prompt systems, experiments, and release readiness"
  },
  projects: {
    title: "Projects",
    subtitle: "Organize product workspaces and delivery streams"
  },
  prompts: {
    title: "Prompts",
    subtitle: "Create prompt definitions and manage versioned templates"
  },
  datasets: {
    title: "Datasets",
    subtitle: "Build evaluation datasets and add benchmark items"
  },
  experiments: {
    title: "Experiments",
    subtitle: "Launch evaluations and monitor execution readiness"
  },
  deployments: {
    title: "Deployments",
    subtitle: "Monitor release status and environment health"
  },
  observability: {
    title: "Analytics",
    subtitle: "Compare performance, latency, and experiment outcomes"
  },
  evaluations: {
    title: "Evaluations",
    subtitle: "Review benchmark coverage and scoring quality"
  },
  playground: {
    title: "Playground",
    subtitle: "Run prompt versions across models in one workspace"
  },
  "api-keys": {
    title: "API Keys",
    subtitle: "Manage credentials and environment access"
  },
  settings: {
    title: "Settings",
    subtitle: "Adjust workspace defaults and team preferences"
  }
};

function App() {
  const [activeView, setActiveView] = useState("workbench");
  const [token, setToken] = useState(() => getStoredToken());
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(() => localStorage.getItem(activeProjectStorageKey) || "");
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

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem(activeProjectStorageKey, activeProjectId);
      return;
    }

    localStorage.removeItem(activeProjectStorageKey);
  }, [activeProjectId]);

  const filteredPrompts = useMemo(
    () => prompts.filter((prompt) => !activeProjectId || prompt.project_id === activeProjectId),
    [activeProjectId, prompts]
  );
  const filteredDatasets = useMemo(
    () => datasets.filter((dataset) => !activeProjectId || dataset.project_id === activeProjectId),
    [activeProjectId, datasets]
  );
  const promptVersions = useMemo(
    () => filteredPrompts.flatMap((prompt) => prompt.versions.map((version) => ({
      ...version,
      prompt_name: prompt.name,
      project_id: prompt.project_id
    }))),
    [filteredPrompts]
  );
  const promptVersionMap = useMemo(
    () => Object.fromEntries(promptVersions.map((version) => [version.id, version])),
    [promptVersions]
  );
  const filteredExperiments = useMemo(
    () => experiments.filter((experiment) => {
      if (!activeProjectId) return true;
      const winnerVersionId = experiment.winner?.prompt_version_id;

      if (!winnerVersionId) return false;

      return promptVersionMap[winnerVersionId]?.project_id === activeProjectId;
    }),
    [activeProjectId, experiments, promptVersionMap]
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
  const recentExperiments = useMemo(
    () => filteredExperiments.slice(0, 6).map((experiment) => ({
      ...experiment,
      avg_latency_ms: experiment.experiment_id === selectedExperimentId ? averageLatencyMs : null
    })),
    [averageLatencyMs, filteredExperiments, selectedExperimentId]
  );
  const totalRuns = useMemo(
    () => filteredExperiments.reduce((total, experiment) => total + (experiment.num_runs || 0), 0),
    [filteredExperiments]
  );
  const tokenUsage = useMemo(
    () => runs.reduce((total, run) => total + (Number(run.extra_data?.tokens_used || run.extra_data?.tokens || 0) || 0), 0),
    [runs]
  );
  const deploymentOverview = useMemo(
    () => ({
      productionCount: 0,
      stagingCount: 0,
      deployedVersionCount: promptVersions.length ? Math.min(promptVersions.length, 3) : 0
    }),
    [promptVersions.length]
  );
  const activityItems = useMemo(() => {
    const items = [];

    if (filteredExperiments[0]) {
      items.push({
        type: "experiment",
        title: "Experiment benchmark updated",
        meta: filteredExperiments[0].winner?.prompt_version_id ? "Experiment" : "Run queue",
        description: `Latest experiment ${filteredExperiments[0].experiment_id.slice(0, 8)} is tracking ${filteredExperiments[0].num_runs || 0} runs.`
      });
    }

    if (selectedPromptVersion) {
      items.push({
        type: "prompt",
        title: "Prompt version active",
        meta: selectedPromptVersion.model,
        description: `Version v${selectedPromptVersion.version} is available for testing and evaluation in the active workspace.`
      });
    }

    if (filteredDatasets[0]) {
      items.push({
        type: "dataset",
        title: "Dataset ready for evaluation",
        meta: `${filteredDatasets[0].items.length} items`,
        description: `${filteredDatasets[0].name} can be used for experiment runs and future evaluator workflows.`
      });
    }

    items.push({
      type: "deployment",
      title: "Deployment control plane online",
      meta: deploymentOverview.productionCount ? "Live environments" : "Environment visibility",
      description: deploymentOverview.productionCount
        ? "Production deployment signals are visible in the dashboard alongside staging readiness."
        : "Production and staging surfaces now have dedicated operational UI while preserving existing deployment wiring."
    });

    return items.slice(0, 4);
  }, [deploymentOverview.productionCount, filteredDatasets, filteredExperiments, selectedPromptVersion]);
  const modelUsage = useMemo(() => {
    const usageMap = new Map();

    promptVersions.forEach((version) => {
      const current = usageMap.get(version.model) || {
        model: version.model,
        versionCount: 0,
        experimentCount: 0
      };
      current.versionCount += 1;
      usageMap.set(version.model, current);
    });

    filteredExperiments.forEach((experiment) => {
      const model = promptVersionMap[experiment.winner?.prompt_version_id]?.model;
      if (!model) return;

      const current = usageMap.get(model) || {
        model,
        versionCount: 0,
        experimentCount: 0
      };
      current.experimentCount += 1;
      usageMap.set(model, current);
    });

    const values = Array.from(usageMap.values())
      .map((item) => {
        const total = item.versionCount + item.experimentCount;
        return {
          model: item.model,
          total,
          coverage: Math.min(total * 20, 100),
          subtitle: `${item.versionCount} versions / ${item.experimentCount} experiments`
        };
      })
      .sort((a, b) => b.total - a.total);

    return values.slice(0, 5);
  }, [filteredExperiments, promptVersionMap, promptVersions]);

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
      const [projectRes, promptRes, datasetRes, experimentRes] = await Promise.all([
        getProjects(),
        getPrompts(),
        getDatasets(),
        getExperiments()
      ]);

      const sortedExperiments = [...experimentRes.data].sort(
        (a, b) => (b.avg_score || 0) - (a.avg_score || 0)
      );

      setProjects(projectRes.data);
      setPrompts(promptRes.data);
      setDatasets(datasetRes.data);
      setExperiments(sortedExperiments);

      const hasActiveProject = projectRes.data.some((project) => project.id === activeProjectId);
      const nextProjectId = hasActiveProject ? activeProjectId : projectRes.data[0]?.id || "";

      if (nextProjectId !== activeProjectId) {
        setActiveProjectId(nextProjectId);
      }
    } catch (error) {
      handleApiError(error, "Could not load dashboard data.");
    }
  }, [activeProjectId, handleApiError, token]);

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

  useEffect(() => {
    if (!filteredPrompts.some((prompt) => prompt.id === selectedPromptId)) {
      setSelectedPromptId(filteredPrompts[0]?.id || "");
    }
  }, [filteredPrompts, selectedPromptId]);

  useEffect(() => {
    if (!promptVersions.some((version) => version.id === selectedPromptVersionId)) {
      setSelectedPromptVersionId(promptVersions[0]?.id || "");
    }
  }, [promptVersions, selectedPromptVersionId]);

  useEffect(() => {
    if (!filteredDatasets.some((dataset) => dataset.id === selectedDatasetId)) {
      setSelectedDatasetId(filteredDatasets[0]?.id || "");
    }
  }, [filteredDatasets, selectedDatasetId]);

  useEffect(() => {
    if (!filteredExperiments.some((experiment) => experiment.experiment_id === selectedExperimentId)) {
      setSelectedExperimentId(filteredExperiments[0]?.experiment_id || "");
      setRuns([]);
      setSummary(null);
      setStatus(null);
    }
  }, [filteredExperiments, selectedExperimentId]);

  useEffect(() => () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const handleCreatePrompt = async (event) => {
    event.preventDefault();
    if (!activeProjectId) {
      setMessage("Select a project first.");
      return;
    }

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
    if (!activeProjectId) {
      setMessage("Select a project first.");
      return;
    }

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

  const handleAddItem = async () => {
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

    if (!activeProjectId) {
      setMessage("Select a project first.");
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

  const maxScore = Math.max(...filteredExperiments.map((exp) => exp.avg_score || 0), 1);
  const currentViewMeta = viewMeta[activeView] || viewMeta.workbench;
  const dashboardMetrics = [
    {
      title: "Prompts",
      value: filteredPrompts.length,
      subtitle: selectedPromptVersion ? `Active model: ${selectedPromptVersion.model}` : "No prompt version selected"
    },
    {
      title: "Datasets",
      value: filteredDatasets.length,
      subtitle: selectedDatasetId ? "Dataset ready for evaluation" : "Select or create a dataset"
    },
    {
      title: "Experiments",
      value: filteredExperiments.length,
      subtitle: status?.status ? `Latest status: ${status.status}` : "No active experiment"
    }
  ];
  const operationalMetrics = [
    {
      title: "Total Runs",
      value: totalRuns,
      subtitle: filteredExperiments.length ? "Across visible experiments" : "No experiment runs yet",
      eyebrow: "Monitoring volume",
      detail: "Execution coverage"
    },
    {
      title: "Average Latency",
      value: formatLatency(averageLatencyMs),
      subtitle: selectedExperimentId ? "Based on loaded experiment runs" : "Load an experiment for live latency",
      eyebrow: "Performance telemetry",
      detail: "Operational baseline"
    },
    {
      title: "Token Usage",
      value: tokenUsage || "n/a",
      subtitle: tokenUsage ? "Captured from loaded run metadata" : "Token totals unavailable in current sample",
      eyebrow: "Cost signal",
      detail: "Run metadata"
    },
    {
      title: "Active Deployments",
      value: deploymentOverview.productionCount,
      subtitle: deploymentOverview.productionCount ? "Production deployments detected" : "Deployment API not yet surfaced",
      tone: deploymentOverview.productionCount ? "good" : "warn",
      eyebrow: deploymentOverview.productionCount ? "Production online" : "Production pending",
      detail: "Release operations"
    }
  ];

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
    setProjects([]);
    setActiveProjectId("");
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

  const projectSelectProps = getScrollableSelectProps(projects.length + 1);
  const renderPlaceholderView = () => (
    <>
      <section className="metricGrid">
        <MetricCard
          title="Workspaces"
          value={projects.length}
          subtitle={activeProjectId ? "Project context is active" : "Select a project to begin"}
        />
        <MetricCard title="Connected Views" value="7" subtitle="Operational pages are now separated by workflow" />
        <MetricCard title="Status" value="Planned" subtitle="This section is scaffolded for future product work" />
      </section>
      <section className="panel placeholderState">
        <div className="panelHeader">
          <h2>{currentViewMeta.title}</h2>
        </div>
        <p>
          {currentViewMeta.subtitle}. The shell is ready here, and the existing FlowLM functionality remains available
          in the dedicated operational pages.
        </p>
      </section>
    </>
  );

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
    <DashboardLayout
      navItems={navigationItems}
      activeView={activeView}
      onNavigate={setActiveView}
      onLogout={handleLogout}
      title={currentViewMeta.title}
      subtitle={currentViewMeta.subtitle}
      projects={projects}
      activeProjectId={activeProjectId}
      onProjectChange={setActiveProjectId}
      projectSelectProps={projectSelectProps}
      contentStyle={{ display: "grid", gap: 24 }}
    >
      <div className="shell">
        {message && <div className="notice">{message}</div>}

        {activeView === "workbench" && (
          <DashboardPage
            operationalMetrics={operationalMetrics}
            recentExperiments={recentExperiments}
            promptVersionMap={promptVersionMap}
            formatScore={formatScore}
            formatLatency={formatLatency}
            deploymentOverview={deploymentOverview}
            activityItems={activityItems}
            dashboardMetrics={dashboardMetrics}
            modelUsage={modelUsage}
            onNavigate={setActiveView}
          />
        )}

        {activeView === "prompts" && (
          <PromptsPage
            prompts={filteredPrompts}
            promptVersions={promptVersions}
            selectedPromptId={selectedPromptId}
            setSelectedPromptId={setSelectedPromptId}
            promptName={promptName}
            setPromptName={setPromptName}
            promptDescription={promptDescription}
            setPromptDescription={setPromptDescription}
            promptTemplate={promptTemplate}
            setPromptTemplate={setPromptTemplate}
            promptVariables={promptVariables}
            setPromptVariables={setPromptVariables}
            promptModel={promptModel}
            setPromptModel={setPromptModel}
            promptConfig={promptConfig}
            setPromptConfig={setPromptConfig}
            handleCreatePrompt={handleCreatePrompt}
            handleCreatePromptVersion={handleCreatePromptVersion}
            loading={loading}
          />
        )}

        {activeView === "datasets" && (
          <DatasetsPage
            datasets={filteredDatasets}
            selectedDatasetId={selectedDatasetId}
            setSelectedDatasetId={setSelectedDatasetId}
            datasetName={datasetName}
            setDatasetName={setDatasetName}
            datasetDescription={datasetDescription}
            setDatasetDescription={setDatasetDescription}
            itemInput={itemInput}
            setItemInput={setItemInput}
            expectedOutput={expectedOutput}
            setExpectedOutput={setExpectedOutput}
            handleCreateDataset={handleCreateDataset}
            handleAddItem={handleAddItem}
            getScrollableSelectProps={getScrollableSelectProps}
            loading={loading}
          />
        )}

        {activeView === "experiments" && (
          <ExperimentsPage
            filteredExperiments={filteredExperiments}
            promptVersions={promptVersions}
            filteredDatasets={filteredDatasets}
            selectedPromptVersionId={selectedPromptVersionId}
            setSelectedPromptVersionId={setSelectedPromptVersionId}
            selectedDatasetId={selectedDatasetId}
            setSelectedDatasetId={setSelectedDatasetId}
            selectedPromptVersion={selectedPromptVersion}
            status={status}
            handleRunExperiment={handleRunExperiment}
            loading={loading}
            getScrollableSelectProps={getScrollableSelectProps}
            formatScore={formatScore}
            formatLatency={formatLatency}
            averageLatencyMs={averageLatencyMs}
          />
        )}

        {activeView === "deployments" && (
          <DeploymentsPage
            deploymentOverview={deploymentOverview}
            promptVersions={promptVersions}
            onNavigate={setActiveView}
          />
        )}

        {activeView === "observability" && (
          <AnalyticsPage
            filteredExperiments={filteredExperiments}
            averageLatencyMs={averageLatencyMs}
            summary={summary}
            formatScore={formatScore}
            formatLatency={formatLatency}
            observabilityDashboard={(
              <ObservabilityDashboard
                experiments={filteredExperiments}
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
          />
        )}

        {activeView === "playground" && <PlaygroundPage versions={promptVersions} />}
        {!["workbench", "prompts", "datasets", "experiments", "deployments", "observability", "playground"].includes(activeView) &&
          renderPlaceholderView()}
      </div>
    </DashboardLayout>
  );
}

export default App;
