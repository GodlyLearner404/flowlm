import React from "react";
import MetricCard from "../UI/MetricCard";

function PromptsPage({
  prompts,
  promptVersions,
  selectedPromptId,
  setSelectedPromptId,
  promptName,
  setPromptName,
  promptDescription,
  setPromptDescription,
  promptTemplate,
  setPromptTemplate,
  promptVariables,
  setPromptVariables,
  promptModel,
  setPromptModel,
  promptConfig,
  setPromptConfig,
  handleCreatePrompt,
  handleCreatePromptVersion,
  loading
}) {
  return (
    <>
      <section className="metricGrid">
        <MetricCard title="Prompts" value={prompts.length} subtitle="Workspace prompt definitions" />
        <MetricCard title="Versions" value={promptVersions.length} subtitle="Prompt versions available for testing" />
        <MetricCard
          title="Selected Prompt"
          value={selectedPromptId ? "Active" : "None"}
          subtitle={selectedPromptId ? "Ready for versioning" : "Choose or create a prompt to continue"}
        />
      </section>

      <section className="grid">
        <form className="panel" onSubmit={handleCreatePrompt}>
          <div className="panelHeader">
            <h2>Prompt Editor</h2>
            <button type="submit" disabled={loading}>Create prompt</button>
          </div>
          <label>Name<input value={promptName} onChange={(e) => setPromptName(e.target.value)} /></label>
          <label>Description<input value={promptDescription} onChange={(e) => setPromptDescription(e.target.value)} /></label>
          <div className="datasetSelect">
            <span>Active prompt</span>
            <select value={selectedPromptId} onChange={(e) => setSelectedPromptId(e.target.value)}>
              <option value="">Select prompt</option>
              {prompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>{prompt.name}</option>
              ))}
            </select>
          </div>
        </form>

        <section className="panel" style={{ display: "grid", gap: 12 }}>
          <div className="panelHeader">
            <h2>Version Builder</h2>
            <button type="button" onClick={handleCreatePromptVersion} disabled={loading}>Create version</button>
          </div>
          <label>Template<textarea rows="6" value={promptTemplate} onChange={(e) => setPromptTemplate(e.target.value)} /></label>
          <div className="split">
            <label>Variables<input value={promptVariables} onChange={(e) => setPromptVariables(e.target.value)} /></label>
            <label>Model<input value={promptModel} onChange={(e) => setPromptModel(e.target.value)} /></label>
          </div>
          <label>Config JSON<textarea rows="4" value={promptConfig} onChange={(e) => setPromptConfig(e.target.value)} /></label>
        </section>
      </section>
    </>
  );
}

export default PromptsPage;
