import React from "react";

function RecentExperiments({ experiments, promptVersionMap, formatScore, formatLatency }) {
  return (
    <section
      className="panel"
      style={{ minWidth: 0, display: "grid", gap: 12 }}
    >
      <div className="panelHeader">
        <h2>Recent Experiments</h2>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>{experiments.length} visible</span>
      </div>
      <div className="modernScroll experimentListScroll">
        {!experiments.length && (
          <p className="empty">Run an experiment to populate recent operational activity.</p>
        )}
        {experiments.map((experiment) => {
          const modelName = promptVersionMap[experiment.winner?.prompt_version_id]?.model || "n/a";

          return (
            <article
              key={experiment.experiment_id}
              className="compactListCard"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 8
                }}
              >
                <strong style={{ fontSize: 14 }}>Exp {experiment.experiment_id.slice(0, 8)}</strong>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{modelName}</span>
              </div>
              <div className="compactMetrics">
                <div>
                  <span>Score</span>
                  <strong className="scoreBadge" style={{ display: "inline-flex", marginTop: 6 }}>
                    {formatScore(experiment.avg_score)}
                  </strong>
                </div>
                <div>
                  <span>Runs</span>
                  <strong style={{ display: "block", color: "var(--ink)", marginTop: 3 }}>{experiment.num_runs || 0}</strong>
                </div>
                <div>
                  <span>Latency</span>
                  <strong style={{ display: "block", color: "var(--ink)", marginTop: 3 }}>{formatLatency(experiment.avg_latency_ms)}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default RecentExperiments;
