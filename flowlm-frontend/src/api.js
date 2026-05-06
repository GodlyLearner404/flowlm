import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"
});

export const getStoredToken = () => {
  const token = localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    localStorage.removeItem("token");
    return "";
  }

  return token;
};

export const getExperiments = () => API.get("/experiments/compare");
export const getSummary = (id) => API.get(`/experiment/${id}/summary`);
export const getStatus = (id) => API.get(`/experiment/${id}/status`);
export const getRuns = (id) => API.get(`/experiment/${id}/runs`);
export const getPrompts = () => API.get("/prompts");
export const getPromptVersions = () =>
  API.get("/prompt-versions"); // or your actual endpoint

export const login = (email, password) =>
  API.post("/auth/login", null, {
    params: { email, password }
  });

export const runPlayground = (version_id, input_data, models) =>
  API.post("/playground/run", {
    version_id,
    input_data,
    models
  });

API.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});
export const createPrompt = (name, description) => 
  API.post("/prompt", null, { params: { name, description } });
export const createPromptVersion = (promptId, payload) =>
  API.post(`/prompt/${promptId}/version`, payload);

export const getDatasets = () => API.get("/datasets");
export const createDataset = (payload) => API.post("/dataset", payload);
export const addDatasetItem = (datasetId, payload) =>
  API.post(`/dataset/${datasetId}/item`, payload);

export const runExperiment = (prompt_version_ids, dataset_id) =>
  API.post("/experiment/run", prompt_version_ids, {
    params: { dataset_id }
  });

export default API;
