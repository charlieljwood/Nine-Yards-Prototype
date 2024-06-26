import { ElementGroupEvents, WhiteboardEvents } from "nine-yards-whiteboard-core";

export type StateMutation = WhiteboardEvents["element:mutation"];
export type ViewportMutation = WhiteboardEvents["viewport:mutation"];
export type ToolSelection = WhiteboardEvents["tool:selected"];

export type SelectionUpdate = ElementGroupEvents["updated"];
