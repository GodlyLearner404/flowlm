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
  const selectedSummary = experiments.find((experiment) => experiment.experiment_id === selectedExperimentId);
  const tokenTotalsByVersion = runs.reduce((totals, run) => {
    const versionId = run.prompt_version_id || selectedSummary?.winner?.prompt_version_id;
    const tokens = Number(run.extra_data?.tokens_used || run.extra_data?.tokens || 0) || 0;

    if (!versionId) return totals;

    totals[versionId] = (totals[versionId] || 0) + tokens;
    return totals;
  }, {});
  const runStatsByVersion = runs.reduce((stats, run) => {
    const versionId = run.prompt_version_id || selectedSummary?.winner?.prompt_version_id;

    if (!versionId) return stats;

    if (!stats[versionId]) {
      stats[versionId] = {
        latencyTotal: 0,
        latencyCount: 0
      };
    }

    if (run.latency_ms !== null && run.latency_ms !== undefined) {
      stats[versionId].latencyTotal += Number(run.latency_ms);
      stats[versionId].latencyCount += 1;
    }

    return stats;
  }, {});
  const winnerGap = summary?.versions?.length > 1 && summary?.winner
    ? (() => {
        const sorted = [...summary.versions].sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0));
        const first = sorted[0]?.avg_score || 0;
        const second = sorted[1]?.avg_score || 0;
        return (first - second).toFixed(2);
      })()
    : null;

  return (
    <>
      <section className="analyticsOverviewGrid lower" style={{ marginTop: 0 }}>
        <div className="panel" style={{ paddingBottom: 12, minWidth: 0 }}>
          <div className="panelHeader">
            <h2>Experiments</h2>
            <button type="button" onClick={loadAll}>Refresh</button>
          </div>
          <div className="tableWrap modernScroll experimentTableWrap" style={{ marginTop: 10 }}>
            <table className="comparisonTable">
              <thead>
                <tr>
                  <th>Experiment</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Runs</th>
                  <th>Avg score</th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => (
                  <tr
                    key={exp.experiment_id}
                    className={selectedExperimentId === exp.experiment_id ? "selected" : ""}
                    onClick={() => setSelectedExperimentId(exp.experiment_id)}
                  >
                    <td>
                      <div className="tablePrimaryCell">
                        <strong>Exp {exp.experiment_id.slice(0, 8)}</strong>
                        <span>{selectedExperimentId === exp.experiment_id ? "Selected experiment" : "Click to inspect"}</span>
                      </div>
                    </td>
                    <td>{promptVersionMap[exp.winner?.prompt_version_id]?.model || "n/a"}</td>
                    <td>
                      <span className={`statusChip statusChip-${exp.winner?.prompt_version_id ? "good" : "default"}`}>
                        {exp.winner?.prompt_version_id ? "completed" : "pending"}
                      </span>
                    </td>
                    <td>{exp.num_runs || 0}</td>
                    <td>
                      <span className="scoreBadge">{formatScore(exp.avg_score)}</span>
                    </td>
                    <td>{exp.winner?.prompt_version_id ? exp.winner.prompt_version_id.slice(0, 8) : "n/a"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel" style={{ minWidth: 0, display: "grid", gap: 16 }}>
          <div className="panelHeader">
            <h2>Score Trends</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Top experiment comparison</span>
          </div>
          <div className="chart modernChart">
            {experiments.slice(0, 8).reverse().map((exp) => (
              <button
                key={exp.experiment_id}
                className={`bar${selectedExperimentId === exp.experiment_id ? " active" : ""}`}
                style={{ height: `${Math.max(((exp.avg_score || 0) / maxScore) * 100, 6)}%` }}
                onClick={() => setSelectedExperimentId(exp.experiment_id)}
                title={`${exp.experiment_id}: ${formatScore(exp.avg_score)}`}
              >
                <span>{formatScore(exp.avg_score)}</span>
              </button>
            ))}
          </div>
          {selectedSummary && (
            <div className="compactListCard operationalCard">
              <strong>Selected benchmark</strong>
              <p>
                Experiment {selectedSummary.experiment_id.slice(0, 8)} has {selectedSummary.num_runs || 0} runs with an
                average score of {formatScore(selectedSummary.avg_score)}.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="panel runsPanel">
        <div className="panelHeader">
          <h2>Evaluation insights</h2>
          <button type="button" onClick={() => selectedExperimentId && loadRuns(selectedExperimentId)}>
            Load runs
          </button>
        </div>
        {summary?.winner && (
          <div className="winnerHero">
            <div>
              <span className="winnerPill">Best Performing Version</span>
              <h2>Winner</h2>
              <p>{summary.winner.prompt_version_id}</p>
              <p className="winnerReasoning">
                {winnerGap !== null
                  ? `Operational reasoning: this candidate leads the current comparison set by ${winnerGap} average score points.`
                  : "Operational reasoning: this candidate currently leads the loaded comparison set on average score."}
              </p>
            </div>
            <div className="winnerStats">
              <div>
                <span>Model</span>
                <strong>{promptVersionMap[summary.winner.prompt_version_id]?.model || "n/a"}</strong>
              </div>
              <div>
                <span>Score</span>
                <strong>{formatScore(summary.winner.avg_score)}</strong>
              </div>
              <div>
                <span>Avg latency</span>
                <strong>{formatLatency(averageLatencyMs)}</strong>
              </div>
              <div>
                <span>Tokens</span>
                <strong>{tokenTotalsByVersion[summary.winner.prompt_version_id] || "n/a"}</strong>
              </div>
              {summary?.saved_winner && (
                <div>
                  <span>Saved winner</span>
                  <strong>{summary.saved_winner}</strong>
                </div>
              )}
            </div>
          </div>
        )}
        {summary?.versions?.length > 0 && (
          <div className="tableWrap modernScroll summaryTable">
            <table className="comparisonTable">
              <thead>
                <tr>
                  <th>Prompt version</th>
                  <th>Model</th>
                  <th>Runs</th>
                  <th>Avg score</th>
                  <th>Latency</th>
                  <th>Tokens</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.versions.map((version) => {
                  const isWinner =
                    summary?.winner?.prompt_version_id === version.prompt_version_id;
                  const versionStats = runStatsByVersion[version.prompt_version_id];
                  const avgVersionLatency =
                    versionStats?.latencyCount
                      ? versionStats.latencyTotal / versionStats.latencyCount
                      : null;

                  return (
                    <tr
                      key={version.prompt_version_id}
                      className={isWinner ? "winnerRow" : ""}
                    >
                      <td>
                        <div className="tablePrimaryCell">
                          <strong>{version.prompt_version_id}</strong>
                          <span>{isWinner ? "Top performing version" : "Compared candidate"}</span>
                        </div>
                      </td>
                      <td>{promptVersionMap[version.prompt_version_id]?.model || "n/a"}</td>
                      <td>{version.num_runs}</td>
                      <td><span className="scoreBadge">{formatScore(version.avg_score)}</span></td>
                      <td>{formatLatency(avgVersionLatency)}</td>
                      <td>{tokenTotalsByVersion[version.prompt_version_id] || "n/a"}</td>
                      <td>
                        {isWinner ? (
                          <span className="statusChip statusChip-good">winner</span>
                        ) : (
                          <span className="statusChip statusChip-default">compared</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {summary?.winner && (
          <div className="grid" style={{ marginTop: 12 }}>
            <section className="panel" style={{ minWidth: 0, display: "grid", gap: 10, padding: 16 }}>
              <div className="panelHeader">
                <h2>Comparison readability</h2>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>Loaded telemetry</span>
              </div>
              <div className="compactMetrics">
                <span>Winner {summary.winner.prompt_version_id.slice(0, 8)}</span>
                <span>Score {formatScore(summary.winner.avg_score)}</span>
                <span>Tokens {tokenTotalsByVersion[summary.winner.prompt_version_id] || "n/a"}</span>
              </div>
            </section>
            <section className="panel" style={{ minWidth: 0, display: "grid", gap: 10, padding: 16 }}>
              <div className="panelHeader">
                <h2>Logs & details</h2>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>Run inspection</span>
              </div>
              <p className="empty">
                Detailed outputs, per-run scores, and raw content are listed below so final review stays separated from
                high-level comparison.
              </p>
            </section>
          </div>
        )}
        <div className="runsGrid modernScroll runGridScroll">
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
