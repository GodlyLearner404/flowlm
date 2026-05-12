import React from "react";
import ActivityFeed from "../Dashboard/ActivityFeed";
import AnalyticsOverview from "../Dashboard/AnalyticsOverview";
import DeploymentOverview from "../Dashboard/DeploymentOverview";
import RecentExperiments from "../Dashboard/RecentExperiments";
import MetricCard from "../UI/MetricCard";

function DashboardPage({
  operationalMetrics,
  recentExperiments,
  promptVersionMap,
  formatScore,
  formatLatency,
  deploymentOverview,
  activityItems,
  dashboardMetrics,
  modelUsage,
  onNavigate
}) {
  return (
    <>
      <section style={{ display: "grid", gap: 20 }}>
        <AnalyticsOverview metrics={operationalMetrics} />

        <section className="dashboardSectionGrid dashboardSectionGridWide">
          <RecentExperiments
            experiments={recentExperiments}
            promptVersionMap={promptVersionMap}
            formatScore={formatScore}
            formatLatency={formatLatency}
          />
          <DeploymentOverview
            productionCount={deploymentOverview.productionCount}
            stagingCount={deploymentOverview.stagingCount}
            deployedVersionCount={deploymentOverview.deployedVersionCount}
          />
        </section>

        <section className="dashboardSectionGrid">
          <ActivityFeed items={activityItems} />
          <section className="panel" style={{ minWidth: 0, display: "grid", gap: 14 }}>
            <div className="panelHeader">
              <h2>Workspace Snapshot</h2>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>Current context</span>
            </div>
            <section className="miniMetricGrid">
              {dashboardMetrics.map((metric) => (
                <MetricCard
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  subtitle={metric.subtitle}
                />
              ))}
            </section>
          </section>
        </section>

        <section className="dashboardSectionGrid dashboardSectionGridWide">
          <section className="panel" style={{ minWidth: 0, display: "grid", gap: 16 }}>
            <div className="panelHeader">
              <h2>Model Usage Analytics</h2>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>Prompt versions and experiment coverage</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {!modelUsage.length && (
                <p className="empty">Model usage will appear after prompt versions and experiments are available.</p>
              )}
              {modelUsage.map((item) => (
                <article key={item.model} className="usageRow">
                  <div className="usageRowHeader">
                    <div>
                      <strong>{item.model}</strong>
                      <span>{item.subtitle}</span>
                    </div>
                    <strong>{item.total}</strong>
                  </div>
                  <div className="usageBarTrack">
                    <span className="usageBarFill" style={{ width: `${item.coverage}%` }} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel" style={{ minWidth: 0, display: "grid", gap: 16 }}>
            <div className="panelHeader">
              <h2>Operational Workflows</h2>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>Move from overview to action</span>
            </div>
            <div className="workflowStack">
              <button type="button" className="workflowCard" onClick={() => onNavigate("prompts")}>
                <strong>Prompt Operations</strong>
                <span>Create prompts and publish new prompt versions.</span>
              </button>
              <button type="button" className="workflowCard" onClick={() => onNavigate("datasets")}>
                <strong>Dataset Operations</strong>
                <span>Manage evaluation datasets and add benchmark items.</span>
              </button>
              <button type="button" className="workflowCard" onClick={() => onNavigate("experiments")}>
                <strong>Experiment Queue</strong>
                <span>Select versions, launch runs, and track execution status.</span>
              </button>
              <button type="button" className="workflowCard" onClick={() => onNavigate("deployments")}>
                <strong>Deployment Readiness</strong>
                <span>Review release-facing context and promotion readiness.</span>
              </button>
            </div>
          </section>
        </section>
      </section>
    </>
  );
}

export default DashboardPage;
