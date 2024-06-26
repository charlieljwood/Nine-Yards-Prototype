import { DoodleElement, TOOL_TYPE, ToolType, Whiteboard } from "nine-yards-whiteboard-core";
import { Component, For, Show, createSignal, onCleanup, onMount } from "solid-js";
import { ToolSelection } from "../lib/types";
import Customizer from "./customizer";

const Toolbar: Component<{ whiteboard: Whiteboard }> = (props) => {
  const whiteboard = () => props.whiteboard;

  const [selectedTool, setSelectedTool] = createSignal<ToolType>(whiteboard().getSelectedTool());
  const [selectedElements, setSelectedElements] = createSignal<readonly DoodleElement[]>([]);

  const isShapeTool = () => ["ellipse", "rectangle", "triangle"].includes(selectedTool());

  function onToolChanged(event: ToolSelection): void {
    setSelectedTool(event.type);
  }

  function onSelectionUpdated(): void {
    const board = whiteboard();

    // This clone is a complete waste but
    // without it the reactivity system fails
    // to singal an update.
    //
    // TODO: find a better solution
    const elements = structuredClone(board.getSelectedElements());

    setSelectedElements(elements);
  }

  onMount(() => {
    const board = whiteboard();

    board.on("tool:selected", onToolChanged);

    const selection = board.getSelection();

    board.on("element:mutation", onSelectionUpdated);
    selection.on("updated", onSelectionUpdated);
  })

  onCleanup(() => {
    const board = whiteboard();

    board.off("tool:selected", onToolChanged);

    const selection = board.getSelection();

    board.off("element:mutation", onSelectionUpdated);
    selection.off("updated", onSelectionUpdated);
  })

  return (
    <section id="toolbar-wrapper">
      <Show when={isShapeTool() || selectedElements().length > 0}>
        <Customizer whiteboard={whiteboard()} selectedElements={selectedElements()} />
      </Show>

      <div id="toolbar" class="nine-yards-card">
        <For each={Object.values(TOOL_TYPE)}>{(tool) =>
          <button
            class="nine-yards-button tool-button"
            classList={{ active: selectedTool() === tool }}
            onclick={() => whiteboard().setSelectedTool(tool)}
          >
            <img src={`/src/assets/svg/tools/${tool}.svg`} alt={tool} />
          </button>
        }</For>
      </div>
    </section>
  )
}

export default Toolbar;
