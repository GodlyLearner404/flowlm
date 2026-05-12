import React from "react";

function MetricCard({ title, value, subtitle, tone = "default", eyebrow, detail }) {
  const accentColor =
    tone === "good" ? "var(--good)" : tone === "warn" ? "var(--warn)" : "var(--accent-strong)";

  return (
    <article
      className={`metricCard metricCard-${tone}`}
      style={{ position: "relative", overflow: "hidden" }}
    >
      <span
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: 4,
          background: accentColor
        }}
      />
      {eyebrow && <span className="metricCardEyebrow">{eyebrow}</span>}
      <span className="metricCardTitle">{title}</span>
      <strong className="metricCardValue">{value}</strong>
      {subtitle && <p className="metricCardSubtitle">{subtitle}</p>}
      {detail && <span className="metricCardDetail">{detail}</span>}
    </article>
  );
}

export default MetricCard;
