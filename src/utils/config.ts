import { ModelOption } from "./interfaces";

const BACKEND_URL = process.env.NODE_ENV === "development" ? "http://localhost:4321/" : "https://sunmarize-backend.vercel.app/";

export const OPENAI_URL = `${BACKEND_URL}api/completion/openai`;
export const GEMINI_URL = `${BACKEND_URL}api/completion/gemini`;

export const DEFAULT_MODEL = ModelOption.OPENAI;