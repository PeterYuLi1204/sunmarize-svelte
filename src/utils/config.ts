import { ModelOption } from "./interfaces";

const BACKEND_URL = process.env.NODE_ENV === "development" ? "http://localhost:4321/api/completion" : "https://sunmarize.com/api/completion";

export const OPENAI_URL = `${BACKEND_URL}/openai`;
export const GEMINI_URL = `${BACKEND_URL}/gemini`;

export const DEFAULT_MODEL = ModelOption.OPENAI;