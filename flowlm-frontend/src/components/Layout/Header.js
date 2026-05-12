import React from "react";

function Header({
  title,
  subtitle,
  actions,
  projects,
  activeProjectId,
  onProjectChange,
  projectSelectProps
}) {
  const activeProject = projects.find((project) => project.id === activeProjectId);

  return (
    <header className="dashboardHeader">
      <div className="headerMain">
        <div className="headerTitleGroup">
          <div className="headerWorkspace">
            <span className="workspaceLabel">Active Workspace</span>
            <strong>{activeProject?.name || "Select a project"}</strong>
          </div>
          <div className="headerHeading">
            <span className="headerEyebrow">Operations overview</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        <label className="headerProjectSwitch headerProjectSwitchInline">
          <span>Project Context</span>
          <select
            value={activeProjectId}
            onChange={(event) => onProjectChange(event.target.value)}
            {...projectSelectProps}
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="headerTools">
        <div className="headerUtilityRow">
          <label className="headerSearch">
            <span>Search</span>
            <input type="text" placeholder="Search prompts, runs, and datasets" readOnly />
          </label>
          {actions}
        </div>

        <div className="headerUser">
          <div className="headerAvatar">FL</div>
          <div className="headerUserText">
            <strong>FlowLM User</strong>
            <span>Workspace Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
