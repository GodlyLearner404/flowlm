import React, { useEffect, useState } from "react";
import { runPlayground, getPromptVersions } from "./api";

function Playground() {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [inputs, setInputs] = useState({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    const res = await getPromptVersions();
    setVersions(res.data);
  };

  const handleSelect = (id) => {
    const v = versions.find((x) => x.id === id);
    setSelectedVersion(v);

    // initialize inputs
    const initial = {};
    v.variables.forEach((varName) => {
      initial[varName] = "";
    });

    setInputs(initial);
  };

  const handleRun = async () => {
    setLoading(true);

    try {
      const res = await runPlayground(selectedVersion.id, inputs);
      setOutput(res.data.output);
    } catch (err) {
      setOutput("Error running prompt");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Prompt Playground</h2>

      {/* 🔥 Select version */}
      <select onChange={(e) => handleSelect(e.target.value)}>
        <option>Select Prompt Version</option>
        {versions.map((v) => (
          <option key={v.id} value={v.id}>
            {v.id}
          </option>
        ))}
      </select>

      {/* 🔥 Show template */}
      {selectedVersion && (
        <>
          <h4>Template:</h4>
          <pre>{selectedVersion.template}</pre>

          {/* 🔥 Dynamic inputs */}
          <h4>Inputs:</h4>
          {selectedVersion.variables.map((varName) => (
            <input
              key={varName}
              placeholder={varName}
              value={inputs[varName]}
              onChange={(e) =>
                setInputs({ ...inputs, [varName]: e.target.value })
              }
            />
          ))}
        </>
      )}

      <br /><br />

      <button onClick={handleRun} disabled={loading || !selectedVersion}>
        {loading ? "Running..." : "Run"}
      </button>

      <h3>Output:</h3>
      <pre
        style={{
          backgroundColor: "#f4f4f4",
          border: "1px solid #ccc",
          padding: 8,
          height: 40
        }}
      >{output}</pre>
    </div>
  );
}

export default Playground;
