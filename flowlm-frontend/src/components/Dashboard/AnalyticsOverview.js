import React from "react";
import MetricCard from "../UI/MetricCard";

function AnalyticsOverview({ metrics }) {
  return (
    <section className="metricGrid">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          tone={metric.tone}
        />
      ))}
    </section>
  );
}

export default AnalyticsOverview;
