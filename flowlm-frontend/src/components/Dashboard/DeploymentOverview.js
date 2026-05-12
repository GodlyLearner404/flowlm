import React from "react";

function DeploymentOverview({ productionCount, stagingCount, deployedVersionCount }) {
  const deploymentItems = [
    {
      environment: "Production",
      status: productionCount ? "Live" : "Standby",
      value: productionCount,
      subtitle: productionCount ? "Live prompt versions connected" : "Deployment reads pending frontend wiring",
      tone: productionCount ? "good" : "warn"
    },
    {
      environment: "Staging",
      status: stagingCount ? "Validating" : "Idle",
      value: stagingCount,
      subtitle: stagingCount ? "Pre-release validation targets" : "Staging reads pending frontend wiring",
      tone: stagingCount ? "default" : "warn"
    }
  ];

  return (
    <section className="panel" style={{ minWidth: 0, display: "grid", gap: 12 }}>
      <div className="panelHeader">
        <h2>Deployment Overview</h2>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>Environment health</span>
      </div>
      <div className="deploymentOverviewList">
        {deploymentItems.map((item) => (
          <article key={item.environment} className={`environmentCard environmentCard-${item.tone}`}>
            <div className="environmentCardTop">
              <div>
                <span className="environmentCardLabel">{item.environment}</span>
                <strong className="environmentCardValue">{item.value}</strong>
              </div>
              <span className={`statusChip statusChip-${item.tone}`}>{item.status}</span>
            </div>
            <p className="environmentCardSubtitle">{item.subtitle}</p>
          </article>
        ))}
      </div>
      <div className="deploymentFootnote">
        <span className="deploymentFootnoteLabel">Promotion coverage</span>
        <strong>{deployedVersionCount}</strong>
        <span className="deploymentFootnoteText">
          prompt versions are currently catalogued as deployment-ready artifacts.
        </span>
      </div>
    </section>
  );
}

export default DeploymentOverview;
