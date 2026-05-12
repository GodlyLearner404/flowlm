import React from "react";
import MetricCard from "../UI/MetricCard";

function ExperimentsPage({
  filteredExperiments,
  promptVersions,
  filteredDatasets,
  selectedPromptVersionId,
  setSelectedPromptVersionId,
  selectedDatasetId,
  setSelectedDatasetId,
  selectedPromptVersion,
  status,
  handleRunExperiment,
  loading,
  getScrollableSelectProps,
  formatScore,
  formatLatency,
  averageLatencyMs
}) {
  const selectedDataset = filteredDatasets.find((dataset) => dataset.id === selectedDatasetId);
  const latestExperiments = filteredExperiments.slice(0, 6);
  const topExperiment = filteredExperiments[0] || null;
  const getStatusTone = (value) => {
    if (value === "completed") return "good";
    if (value === "failed") return "warn";
    return "default";
  };
  const getStatusLabel = (value) => {
    if (value === "pending") return "queued";
    return value || "idle";
  };

  return (
    <>
      <section className="metricGrid">
        <MetricCard
          title="Experiments"
          value={filteredExperiments.length}
          subtitle="Visible evaluation runs"
          eyebrow="Overview"
          detail={topExperiment ? `Top score ${formatScore(topExperiment.avg_score)}` : "Awaiting first run"}
        />
        <MetricCard
          title="Run Status"
          value={getStatusLabel(status?.status)}
          subtitle={selectedPromptVersion?.model || "Select a prompt version for execution"}
          eyebrow="Execution state"
          tone={getStatusTone(status?.status)}
          detail={selectedDataset ? `${selectedDataset.items.length} dataset items` : "No dataset selected"}
        />
        <MetricCard
          title="Avg Latency"
          value={formatLatency(averageLatencyMs)}
          subtitle="Based on the currently loaded experiment runs"
          eyebrow="Evaluation signal"
          detail={topExperiment?.winner?.prompt_version_id ? "Winner tracked" : "Winner pending"}
        />
      </section>

      <section className="experimentOverviewGrid">
        <section className="panel" style={{ minWidth: 0, display: "grid", gap: 16 }}>
          <div className="panelHeader">
            <h2>Overview</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Results-first evaluation workspace</span>
          </div>
          <div className="experimentOverviewHero">
            <div className="experimentOverviewCopy">
              <span className={`statusChip statusChip-${getStatusTone(status?.status)}`}>
                {getStatusLabel(status?.status)}
              </span>
              <h3>{topExperiment?.winner?.prompt_version_id ? "Best visible result is already surfaced" : "Queue the next comparison from here"}</h3>
              <p>
                {topExperiment?.winner?.prompt_version_id
                  ? `Experiment ${topExperiment.experiment_id.slice(0, 8)} is currently leading with score ${formatScore(topExperiment.avg_score)}.`
                  : "Choose a prompt version and dataset to begin an evaluation run, then review comparison results below."}
              </p>
            </div>
            <div className="winnerStats">
              <div>
                <span>Selected model</span>
                <strong>{selectedPromptVersion?.model || "No model selected"}</strong>
              </div>
              <div>
                <span>Dataset</span>
                <strong>{selectedDataset ? selectedDataset.name : "No dataset selected"}</strong>
              </div>
              <div>
                <span>Items</span>
                <strong>{selectedDataset?.items.length || 0}</strong>
              </div>
              <div>
                <span>Prompt version</span>
                <strong>{selectedPromptVersion ? `v${selectedPromptVersion.version}` : "n/a"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel experimentControlPanel" style={{ minWidth: 0, display: "grid", gap: 14 }}>
          <div className="panelHeader">
            <h2>Launch Control</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Execution inputs</span>
          </div>
          <div className="experimentControlFields">
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
                {...getScrollableSelectProps(filteredDatasets.length + 1)}
              >
                <option value="">Select dataset</option>
                {filteredDatasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.items.length} items)
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="statusBox experimentStatusBox">
            <span>Status</span>
            <strong>{getStatusLabel(status?.status)}</strong>
            {selectedPromptVersion?.model && <small>{selectedPromptVersion.model}</small>}
          </div>
          <button className="primary" onClick={handleRunExperiment} disabled={loading}>
            {loading ? "Working..." : "Run experiment"}
          </button>
        </section>
      </section>

      <section className="experimentMainGrid lower" style={{ marginTop: 0 }}>
        <section className="panel" style={{ minWidth: 0, display: "grid", gap: 12 }}>
          <div className="panelHeader">
            <h2>Comparisons</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Latest benchmark runs</span>
          </div>
          <div className="experimentComparisonGrid modernScroll experimentListScroll">
            {!latestExperiments.length && (
              <p className="empty">Launch an experiment to start operational tracking.</p>
            )}
            {latestExperiments.map((experiment, index) => (
              <article
                key={experiment.experiment_id}
                className={`comparisonCard${index === 0 ? " comparisonCard-highlight" : ""}`}
              >
                <div className="comparisonCardHeader">
                  <div className="tablePrimaryCell">
                    <strong>Exp {experiment.experiment_id.slice(0, 8)}</strong>
                    <span>
                      {experiment.winner?.prompt_version_id ? "Winner identified" : "Evaluation in progress"}
                    </span>
                  </div>
                  <span className={`statusChip statusChip-${index === 0 ? "good" : "default"}`}>
                    {index === 0 ? "best result" : "candidate"}
                  </span>
                </div>
                <div className="comparisonMetricGrid">
                  <div>
                    <span>Model</span>
                    <strong>{promptVersions.find((version) => version.id === experiment.winner?.prompt_version_id)?.model || "n/a"}</strong>
                  </div>
                  <div>
                    <span>Score</span>
                    <strong>{formatScore(experiment.avg_score)}</strong>
                  </div>
                  <div>
                    <span>Latency</span>
                    <strong>{formatLatency(experiment.avg_latency_ms)}</strong>
                  </div>
                  <div>
                    <span>Tokens</span>
                    <strong>{experiment.experiment_id === filteredExperiments[0]?.experiment_id ? "Loaded in analytics" : "Load details"}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{experiment.winner?.prompt_version_id ? "Completed" : "Pending"}</strong>
                  </div>
                  <div>
                    <span>Runs</span>
                    <strong>{experiment.num_runs || 0}</strong>
                  </div>
                </div>
                <p>
                  {experiment.winner?.prompt_version_id
                    ? `Winner ${experiment.winner.prompt_version_id.slice(0, 8)} is leading this evaluation set.`
                    : "Winner pending until run scoring completes."}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel" style={{ minWidth: 0, display: "grid", gap: 12 }}>
          <div className="panelHeader">
            <h2>Evaluation Insights</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Winner visibility</span>
          </div>
          <div className="workflowStack">
            <div className="compactListCard operationalCard">
              <strong>Best result</strong>
              <p>
                {topExperiment?.winner?.prompt_version_id
                  ? `Experiment ${topExperiment.experiment_id.slice(0, 8)} is the current leader with score ${formatScore(topExperiment.avg_score)}.`
                  : "Run a comparison to surface the current best candidate."}
              </p>
            </div>
            <div className="compactListCard operationalCard">
              <strong>Winner</strong>
              <p>
                {topExperiment?.winner?.prompt_version_id
                  ? `Prompt version ${topExperiment.winner.prompt_version_id.slice(0, 8)} is currently winning among visible experiments.`
                  : "No winner is available yet for the current dataset slice."}
              </p>
            </div>
            <div className="compactListCard operationalCard">
              <strong>Reasoning</strong>
              <p>
                {topExperiment?.winner?.prompt_version_id
                  ? "The current leader is prioritized because it has the strongest visible average score in the comparison set."
                  : "Detailed evaluation reasoning is not part of the current experiment payload, so this view prioritizes score and completion state."}
              </p>
            </div>
          </div>
        </section>
      </section>

      <section className="grid lower" style={{ marginTop: 0 }}>
        <section className="panel" style={{ minWidth: 0, display: "grid", gap: 12 }}>
          <div className="panelHeader">
            <h2>Logs & Details</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Execution context</span>
          </div>
          <div className="workflowStack">
            <div className="compactListCard">
              <strong>Selected prompt</strong>
              <p>
                {selectedPromptVersion
                  ? `${selectedPromptVersion.prompt_name} v${selectedPromptVersion.version} on ${selectedPromptVersion.model}.`
                  : "No prompt version selected."}
              </p>
            </div>
            <div className="compactListCard">
              <strong>Selected dataset</strong>
              <p>
                {selectedDataset
                  ? `${selectedDataset.name} with ${selectedDataset.items.length} benchmark items is ready for evaluation.`
                  : "No dataset selected."}
              </p>
            </div>
            <div className="compactListCard">
              <strong>Status trace</strong>
              <p>
                {status?.status
                  ? `Current experiment state is ${getStatusLabel(status.status)}. Detailed outputs and token-level comparison remain available on the Analytics page.`
                  : "Queue a run to begin operational tracking and detailed result inspection."}
              </p>
            </div>
          </div>
        </section>

        <section className="panel" style={{ minWidth: 0, display: "grid", gap: 12 }}>
          <div className="panelHeader">
            <h2>Operational Hierarchy</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Recommended flow</span>
          </div>
          <div className="workflowStack">
            <div className="compactListCard">
              <strong>1. Configure one run path</strong>
              <p>Choose the prompt version and dataset with the highest review priority.</p>
            </div>
            <div className="compactListCard">
              <strong>2. Compare results first</strong>
              <p>Use the comparison panel to scan winner, score, latency, and completion state before deeper inspection.</p>
            </div>
            <div className="compactListCard">
              <strong>3. Open analytics for full detail</strong>
              <p>Inspect detailed runs, outputs, and loaded token usage after the top candidate is identified.</p>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}

export default ExperimentsPage;
