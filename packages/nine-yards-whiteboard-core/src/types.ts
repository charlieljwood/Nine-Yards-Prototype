import { KEY, TOOL_TYPE } from "./constants";

export * from "@/base/types";
export * from "@/elements/types";

export type ToolType = typeof TOOL_TYPE[keyof typeof TOOL_TYPE];
export type Key = typeof KEY[keyof typeof KEY];
