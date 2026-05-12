import React from "react";

function ExperimentBlock({ run, formatScore, formatLatency, modelName, truncate }) {
  const tokenCount = run.extra_data?.tokens_used || run.extra_data?.tokens || "n/a";

  return (
    <article className="runCard">
      <div className="runMeta" style={{ alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <span className="runEyebrow">Run {run.id.slice(0, 8)}</span>
          <strong>Score {formatScore(run.score)}</strong>
        </div>
        <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
          <span className="scoreBadge">{modelName || "Model n/a"}</span>
          <span className="statusChip statusChip-default">{formatLatency(run.latency_ms)}</span>
        </div>
      </div>
      <div className="comparisonMetricGrid">
        <div>
          <span>Tokens</span>
          <strong>{tokenCount}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{run.score === null || run.score === undefined ? "Pending score" : "Scored"}</strong>
        </div>
      </div>
      <div className="runSection">
        <span className="runSectionLabel">Input</span>
        <pre>{JSON.stringify(run.input, null, 2)}</pre>
      </div>
      <div className="runSection">
        <span className="runSectionLabel">Output</span>
        <p>{truncate(run.output)}</p>
      </div>
    </article>
  );
}

export default ExperimentBlock;
