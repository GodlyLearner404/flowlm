import React from "react";
import MetricCard from "../UI/MetricCard";

function DeploymentsPage({ deploymentOverview, promptVersions, onNavigate }) {
  const productionState = deploymentOverview.productionCount ? "Live traffic" : "Awaiting source";
  const stagingState = deploymentOverview.stagingCount ? "Validation open" : "Pre-release idle";
  const deploymentActivity = [
    {
      title: "Release catalog synchronized",
      meta: `${promptVersions.length} versions`,
      description: promptVersions.length
        ? `${promptVersions.length} prompt artifacts are visible in the release workspace and ready for promotion review.`
        : "Create prompt versions to populate the deployment catalog."
    },
    {
      title: "Environment visibility separated",
      meta: "Production / staging",
      description: "Operational status now distinguishes live traffic from pre-release validation targets."
    },
    {
      title: "Monitoring handoff available",
      meta: "Analytics linked",
      description: "Latency, score, and token signals remain accessible without leaving the release workflow."
    }
  ];
  const modelsRepresented = new Set(promptVersions.map((version) => version.model).filter(Boolean)).size;

  return (
    <>
      <section className="metricGrid">
        <MetricCard
          title="Production Surface"
          value={deploymentOverview.productionCount}
          subtitle="Live prompt deployments connected to the workspace"
          eyebrow={productionState}
          tone={deploymentOverview.productionCount ? "good" : "warn"}
          detail="Customer-facing"
        />
        <MetricCard
          title="Staging Surface"
          value={deploymentOverview.stagingCount}
          subtitle="Pre-release deployment targets"
          eyebrow={stagingState}
          detail="Validation lane"
        />
        <MetricCard
          title="Promotion Ready"
          value={deploymentOverview.deployedVersionCount}
          subtitle="Prompt versions available for promotion"
          eyebrow={promptVersions.length ? "Release inventory" : "No artifacts yet"}
          detail={`${modelsRepresented || 0} models represented`}
        />
      </section>

      <section className="grid">
        <section className="panel" style={{ minWidth: 0, display: "grid", gap: 12 }}>
          <div className="panelHeader">
            <h2>Environment Control Plane</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Release operations</span>
          </div>
          <div className="environmentGrid">
            <article className="environmentCard environmentCard-good">
              <div className="environmentCardTop">
                <div>
                  <span className="environmentCardLabel">Production</span>
                  <strong className="environmentCardValue">{deploymentOverview.productionCount}</strong>
                </div>
                <span className={`statusChip statusChip-${deploymentOverview.productionCount ? "good" : "warn"}`}>
                  {productionState}
                </span>
              </div>
              <p className="environmentCardSubtitle">
                Dedicated visibility for live environments, release counts, and customer-facing readiness.
              </p>
            </article>
            <article className="environmentCard">
              <div className="environmentCardTop">
                <div>
                  <span className="environmentCardLabel">Staging</span>
                  <strong className="environmentCardValue">{deploymentOverview.stagingCount}</strong>
                </div>
                <span className={`statusChip statusChip-${deploymentOverview.stagingCount ? "default" : "warn"}`}>
                  {stagingState}
                </span>
              </div>
              <p className="environmentCardSubtitle">
                Pre-production verification remains distinct so release candidates are easy to audit before promotion.
              </p>
            </article>
          </div>
          <div className="deploymentFootnote">
            <span className="deploymentFootnoteLabel">Control note</span>
            <strong>Frontend-ready</strong>
            <span className="deploymentFootnoteText">
              Existing deployment APIs and backend workflows are preserved while the UI moves toward operations-grade
              visibility.
            </span>
          </div>
        </section>

        <section className="panel" style={{ minWidth: 0, display: "grid", gap: 12 }}>
          <div className="panelHeader">
            <h2>Monitoring Overview</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Release-adjacent telemetry</span>
          </div>
          <div className="workflowStack">
            <div className="compactListCard operationalCard">
              <strong>Latency posture</strong>
              <p>Use observability to confirm response-time behavior before advancing prompt versions into live lanes.</p>
            </div>
            <div className="compactListCard operationalCard">
              <strong>Token analytics</strong>
              <p>Token consumption is surfaced alongside experiments so release decisions stay grounded in cost signals.</p>
            </div>
            <div className="compactListCard operationalCard">
              <strong>Activity tracking</strong>
              <p>Deployment context now sits closer to operational events instead of being buried as a placeholder.</p>
            </div>
          </div>
        </section>
      </section>

      <section className="grid">
        <section className="panel" style={{ minWidth: 0, display: "grid", gap: 12 }}>
          <div className="panelHeader">
            <h2>Deployment Activity</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Recent release signals</span>
          </div>
          <div className="activityTimeline">
            {deploymentActivity.map((item, index) => (
              <article key={`${item.title}-${index}`} className="activityItem">
                <div className="activityMarker activityMarker-good" />
                <div className="activityContent">
                  <div className="activityHeaderRow">
                    <strong style={{ fontSize: 14 }}>{item.title}</strong>
                    <span className="activityMeta">{item.meta}</span>
                  </div>
                  <p style={{ color: "var(--muted)", lineHeight: 1.5, margin: "6px 0 0" }}>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel" style={{ minWidth: 0, display: "grid", gap: 12 }}>
          <div className="panelHeader">
            <h2>Related Workflows</h2>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Go to source pages</span>
          </div>
          <div className="workflowStack">
            <button type="button" className="workflowCard" onClick={() => onNavigate("prompts")}>
              <strong>Prompt Versions</strong>
              <span>Create and manage prompt artifacts that can later be deployed.</span>
            </button>
            <button type="button" className="workflowCard" onClick={() => onNavigate("experiments")}>
              <strong>Experiment Validation</strong>
              <span>Evaluate versions before promotion to staging or production.</span>
            </button>
            <button type="button" className="workflowCard" onClick={() => onNavigate("observability")}>
              <strong>Analytics Review</strong>
              <span>Inspect winners, latency, and token behavior before release decisions.</span>
            </button>
          </div>
        </section>
      </section>
    </>
  );
}

export default DeploymentsPage;
