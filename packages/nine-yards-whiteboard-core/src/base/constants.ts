import { TOOL_TYPE } from "@/constants";
import type {
  StaticWhiteboardSettings,
  ViewportState,
  WhiteboardSettings,
} from "./types";

export const ZOOM_STEP = 0.1;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 30;

export const TRANSFORM_POINT_RADIUS = 3;
export const TRANSFORM_POINT_THRESHOLD = 5;
export const TRANSFORM_EDGE_PADDING = 2;
export const ROTATION_OFFSET = 10;
export const MINIMUM_DIMENSION = 5;

export const DEFAULT_VIEWPORT: ViewportState = {
  scrollX: 0,
  scrollY: 0,
  zoom: 2,
};

export const DEFAULT_STATIC_WHITEBOARD_SETTINGS: StaticWhiteboardSettings = {
  width: 100,
  height: 100,
  viewport: DEFAULT_VIEWPORT,
  elements: [],
  background: "#ffffff",
};

export const DEFAULT_WHITEBOARD_SETTINGS: WhiteboardSettings = {
  ...DEFAULT_STATIC_WHITEBOARD_SETTINGS,
  selectedTool: TOOL_TYPE.select,
};
