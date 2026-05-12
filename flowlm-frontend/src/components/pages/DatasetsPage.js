import React from "react";
import MetricCard from "../UI/MetricCard";

function DatasetsPage({
  datasets,
  selectedDatasetId,
  setSelectedDatasetId,
  datasetName,
  setDatasetName,
  datasetDescription,
  setDatasetDescription,
  itemInput,
  setItemInput,
  expectedOutput,
  setExpectedOutput,
  handleCreateDataset,
  handleAddItem,
  getScrollableSelectProps,
  loading
}) {
  const selectedDataset = datasets.find((dataset) => dataset.id === selectedDatasetId);

  return (
    <>
      <section className="metricGrid">
        <MetricCard title="Datasets" value={datasets.length} subtitle="Evaluation sets available in workspace" />
        <MetricCard
          title="Dataset Items"
          value={selectedDataset?.items.length || 0}
          subtitle={selectedDataset ? `${selectedDataset.name} selected` : "Choose a dataset to inspect item volume"}
        />
        <MetricCard
          title="Benchmark State"
          value={selectedDatasetId ? "Ready" : "Pending"}
          subtitle={selectedDatasetId ? "Dataset can be used in experiments" : "Create or select a dataset first"}
        />
      </section>

      <section className="grid">
        <form className="panel" onSubmit={handleCreateDataset}>
          <div className="panelHeader">
            <h2>Dataset Editor</h2>
            <button type="submit" disabled={loading}>Create dataset</button>
          </div>
          <label>Name<input value={datasetName} onChange={(e) => setDatasetName(e.target.value)} /></label>
          <label>Description<input value={datasetDescription} onChange={(e) => setDatasetDescription(e.target.value)} /></label>
          <div className="datasetSelect">
            <span>Active dataset</span>
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                setSelectedDatasetId(e.target.value);
                e.target.size = 1;
                e.target.blur();
              }}
              {...getScrollableSelectProps(datasets.length + 1)}
            >
              <option value="">Select dataset</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
              ))}
            </select>
          </div>
        </form>

        <section className="panel" style={{ display: "grid", gap: 12 }}>
          <div className="panelHeader">
            <h2>Dataset Item Builder</h2>
            <button type="button" onClick={handleAddItem} disabled={loading}>Add item</button>
          </div>
          <label>Item input JSON<textarea rows="6" value={itemInput} onChange={(e) => setItemInput(e.target.value)} /></label>
          <label>Expected output<textarea rows="4" value={expectedOutput} onChange={(e) => setExpectedOutput(e.target.value)} /></label>
        </section>
      </section>
    </>
  );
}

export default DatasetsPage;
