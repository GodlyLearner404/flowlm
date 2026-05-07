import React, { useEffect, useState } from "react";
import { runPlayground, getPromptVersions } from "./api";

function formatLatency(latencyMs) {
    if (latencyMs === null || latencyMs === undefined) return "n/a";
    return `${Math.round(Number(latencyMs))} ms`;
}

function Playground() {
    const [versions, setVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [inputs, setInputs] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedModels, setSelectedModels] = useState([]);
    const [results, setResults] = useState([]);

    useEffect(() => {
        loadVersions();
    }, []);

    const loadVersions = async () => {
        const res = await getPromptVersions();
        setVersions(res.data);
    };

    const modelOptions = [
        "tencent/hy3-preview:free",
        "qwen/qwen3-next-80b-a3b-instruct:free",
        "openai/gpt-oss-20b:free"
    ];

    const handleSelect = (id) => {
        const v = versions.find((x) => x.id === id);
        if (!v) {
            setSelectedVersion(null);
            setInputs({});
            return;
        }
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
            const res = await runPlayground(
                selectedVersion.id,
                inputs,
                selectedModels
            );
            setResults(res.data.results);
        } catch (err) {
            setResults([{
                model: "playground",
                status: "failed",
                output: "Error running prompt"
            }]);
        }

        setLoading(false);
    };

  return (
    <div style={{ padding: 20 }}>
        <h2>Prompt Playground</h2>

        {/* 🔥 Select version */}
        <select
            value={selectedVersion?.id || ""}
            onChange={(e) => {
                handleSelect(e.target.value);
                e.target.size = 1;
                e.target.blur();
            }}
            onFocus={(e) => {
                if (versions.length > 6) {
                    e.target.size = 6;
                }
            }}
            onBlur={(e) => {
                e.target.size = 1;
            }}
            style={{ maxHeight: 220, overflowY: "auto" }}
        >
            <option value="">Select Prompt Version</option>
            {versions.map((v) => (
            <option key={v.id} value={v.id}>
                v{v.version} / {v.model} / {v.id}
            </option>
            ))}
        </select>

        <h4>Select Models:</h4>
        {modelOptions.map((m) => (
        <label key={m}>
            <input
            type="checkbox"
            value={m}
            onChange={(e) => {
                if (e.target.checked) {
                setSelectedModels([...selectedModels, m]);
                } else {
                setSelectedModels(selectedModels.filter(x => x !== m));
                }
            }}
            />
            {m}
        </label>
        ))}

        {/* 🔥 Show template */}
        {selectedVersion && (
            <>
            <p style={{ color: "#667085", marginTop: 12 }}>
                Model: <strong style={{ color: "#18202a" }}>{selectedVersion.model}</strong>
            </p>
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

        <h3>Results:</h3>
        {results.map((r) => (
            <div
                key={r.model}
                style={{ border: "1px solid gray", margin: 10, padding: 10 }}
            >
                <h4>{r.model}</h4>
                <p>Status: {r.status || "completed"}</p>
                <pre>{r.output}</pre>
                {r.finish_reason === "length" && (
                    <p style={{ color: "#b45309", fontWeight: 600 }}>
                        ⚠️ Response may have been truncated due to token limit
                    </p>
                )}
                <p>Tokens: {r.tokens}</p>
                <p>Finish Reason: {r.finish_reason || "n/a"}</p>
                <p>Latency: {formatLatency(r.latency_ms)}</p>
            </div>
        ))}
    </div>
  );
}

export default Playground;
