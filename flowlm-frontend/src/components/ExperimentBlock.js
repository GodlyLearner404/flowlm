import React from "react";

function ExperimentBlock({ run, formatScore, formatLatency, modelName, truncate }) {
  return (
    <article className="runCard">
      <div className="runMeta" style={{ alignItems: "flex-start" }}>
        <strong>Score {formatScore(run.score)}</strong>
        <div style={{ display: "grid", gap: 4, justifyItems: "end" }}>
          <span>{run.id.slice(0, 8)}</span>
          <span>{modelName || "Model n/a"}</span>
          <span>{formatLatency(run.latency_ms)}</span>
        </div>
      </div>
      <pre>{JSON.stringify(run.input, null, 2)}</pre>
      <p>{truncate(run.output)}</p>
    </article>
  );
}

export default ExperimentBlock;
