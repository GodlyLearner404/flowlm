import React from "react";

function ActivityFeed({ items }) {
  const getTone = (item) => {
    const value = `${item.type || ""} ${item.title || ""} ${item.meta || ""}`.toLowerCase();

    if (value.includes("deploy")) return "good";
    if (value.includes("dataset")) return "neutral";
    return "default";
  };

  return (
    <section className="panel" style={{ minWidth: 0, display: "grid", gap: 12 }}>
      <div className="panelHeader">
        <h2>Activity Feed</h2>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>Operational timeline</span>
      </div>
      <div className="activityTimeline">
        {!items.length && <p className="empty">Recent prompt, evaluation, and deployment activity will appear here.</p>}
        {items.map((item, index) => (
          <article key={`${item.title}-${index}`} className="activityItem">
            <div className={`activityMarker activityMarker-${getTone(item)}`} />
            <div className="activityContent">
              <div className="activityHeaderRow">
                <strong style={{ fontSize: 14 }}>{item.title}</strong>
                <span className="activityMeta">{item.meta}</span>
              </div>
              <p style={{ color: "var(--muted)", lineHeight: 1.5, margin: "6px 0 0" }}>
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ActivityFeed;
