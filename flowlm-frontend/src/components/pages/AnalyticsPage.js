import React from "react";
import MetricCard from "../UI/MetricCard";

function AnalyticsPage({
  filteredExperiments,
  averageLatencyMs,
  summary,
  formatScore,
  formatLatency,
  observabilityDashboard
}) {
  return (
    <>
      <section className="metricGrid">
        <MetricCard
          title="Experiments"
          value={filteredExperiments.length}
          subtitle="Ranked by average score"
          eyebrow="Monitoring coverage"
          detail="Evaluation inventory"
        />
        <MetricCard
          title="Latency"
          value={formatLatency(averageLatencyMs)}
          subtitle="Across loaded experiment runs"
          eyebrow="Performance signal"
          detail="Release readiness input"
        />
        <MetricCard
          title="Top Score"
          value={summary?.winner ? formatScore(summary.winner.avg_score) : "No score"}
          subtitle="Best performing prompt version"
          eyebrow={summary?.winner ? "Best candidate" : "Awaiting winner"}
          tone={summary?.winner ? "good" : "default"}
          detail="Promotion benchmark"
        />
      </section>
      {summary?.winner && (
        <section className="panel" style={{ display: "grid", gap: 10 }}>
          <div className="panelHeader">
            <h2>Evaluation Summary</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Winner visibility</span>
          </div>
          <div className="compactMetrics">
            <span>Winner {summary.winner.prompt_version_id.slice(0, 8)}</span>
            <span>Score {formatScore(summary.winner.avg_score)}</span>
            <span>Latency {formatLatency(averageLatencyMs)}</span>
          </div>
        </section>
      )}
      {observabilityDashboard}
    </>
  );
}

export default AnalyticsPage;
