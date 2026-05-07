import React from "react";
import ExperimentBlock from "./components/ExperimentBlock";

function ObservabilityDashboard({
  experiments,
  selectedExperimentId,
  setSelectedExperimentId,
  loadAll,
  maxScore,
  summary,
  promptVersionMap,
  formatScore,
  formatLatency,
  averageLatencyMs,
  loadRuns,
  runs,
  singleVersionModel,
  truncate
}) {
  return (
    <>
      <section className="grid lower" style={{ marginTop: 0 }}>
        <div className="panel" style={{ paddingBottom: 12 }}>
          <div className="panelHeader">
            <h2>Experiments</h2>
            <button type="button" onClick={loadAll}>Refresh</button>
          </div>
          <div className="tableWrap" style={{ maxHeight: 320, overflowY: "auto", marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th>Experiment</th>
                  <th>Model</th>
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
                    <td>{promptVersionMap[exp.winner?.prompt_version_id]?.model || "n/a"}</td>
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
            <p>Model: {promptVersionMap[summary.winner.prompt_version_id]?.model || "n/a"}</p>
            <p>Score: {formatScore(summary.winner.avg_score)}</p>
            <p>Avg latency: {formatLatency(averageLatencyMs)}</p>
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
                  <th>Model</th>
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
                      <td>{promptVersionMap[version.prompt_version_id]?.model || "n/a"}</td>
                      <td>{version.num_runs}</td>
                      <td>{formatScore(version.avg_score)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="runsGrid" style={{ maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
          {runs.map((run) => (
            <ExperimentBlock
              key={run.id}
              run={run}
              formatScore={formatScore}
              formatLatency={formatLatency}
              modelName={run.extra_data?.model || singleVersionModel}
              truncate={truncate}
            />
          ))}
          {!runs.length && <p className="empty">Select an experiment and load runs to inspect outputs.</p>}
        </div>
      </section>
    </>
  );
}

export default ObservabilityDashboard;
