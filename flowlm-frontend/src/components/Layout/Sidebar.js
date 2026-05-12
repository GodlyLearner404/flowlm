import React from "react";

function Sidebar({ items, activeItem, onNavigate, onLogout }) {
  return (
    <aside className="dashboardSidebar">
      <div className="sidebarBrand">
        <div className="sidebarBrandMark">F</div>
        <div>
          <p className="sidebarEyebrow">FlowLM</p>
          <h2>Control Center</h2>
        </div>
      </div>

      <div className="sidebarSectionLabel">Workspace</div>

      <nav className="sidebarNav" aria-label="Primary">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebarNavItem${activeItem === item.id ? " active" : ""}`}
            onClick={() => onNavigate(item.id)}
            aria-current={activeItem === item.id ? "page" : undefined}
          >
            <span className="sidebarNavLabel">{item.label}</span>
            {item.subtitle && <span className="sidebarNavMeta">{item.subtitle}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebarFooter">
        <div className="sidebarFootnote">
          <strong>Enterprise prompt ops</strong>
          <span>Operational shell aligned for fast experimentation and review.</span>
        </div>
        <button type="button" className="sidebarLogout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
