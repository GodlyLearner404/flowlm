import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

function DashboardLayout({
  navItems,
  activeView,
  onNavigate,
  onLogout,
  title,
  subtitle,
  headerActions,
  projects,
  activeProjectId,
  onProjectChange,
  projectSelectProps,
  contentStyle,
  children
}) {
  return (
    <div className="dashboardShell">
      <Sidebar
        items={navItems}
        activeItem={activeView}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <div className="dashboardFrame">
        <Header
          title={title}
          subtitle={subtitle}
          actions={headerActions}
          projects={projects}
          activeProjectId={activeProjectId}
          onProjectChange={onProjectChange}
          projectSelectProps={projectSelectProps}
        />
        <main className="dashboardContent" style={contentStyle}>{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
