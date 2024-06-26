import { DoodleElement, FillStyle, ROUGHNESS, Rounding, STROKE_WIDTH, StrokeType, Whiteboard } from "nine-yards-whiteboard-core";
import { Component, For } from "solid-js";
import { findCommonObject } from "../lib/common";
import { COLOURS } from "../lib/constants";

const Customizer: Component<{
  whiteboard: Whiteboard,
  selectedElements: readonly DoodleElement[]
}> = (props) => {
  const whiteboard = () => props.whiteboard;

  const commonElement = () => findCommonObject(props.selectedElements)

  function updateProperty<T extends keyof DoodleElement>(
    key: T,
    value: DoodleElement[T]
  ): void {
    const board = whiteboard();

    board.mutateSelectedElements((element: DoodleElement) => {
      element[key] = value;
      return element;
    })
  }

  return (
    <div id="element-bar" class="nine-yards-card">
      <section id="element-bar-modifiers">
        <section class="modifier-group">
          <span class="modifier-label"> Roughness </span>

          <div class="element-bar-row">
            <For each={Object.entries(ROUGHNESS)}>{([key, value]) =>
              <button
                class="nine-yards-button element-modifier-button"
                classList={{ active: commonElement().roughness === value }}
                onclick={() => updateProperty("roughness", value)}
              >
                <img src={`src/assets/svg/roughness/${key}.svg`} alt={key} />
              </button>
            }</For>
          </div>
        </section>

        <section class="modifier-group">
          <span class="modifier-label"> Rounding </span>

          <div class="element-bar-row">
            <For each={["fixed", "sharp"] as Rounding[]}>{rounding =>
              <button
                class="nine-yards-button element-modifier-button"
                classList={{ active: commonElement().rounding === rounding }}
                onclick={() => updateProperty("rounding", rounding)}
              >
                <img src={`src/assets/svg/rounding/${rounding}.svg`} alt={rounding} />
              </button>
            }</For>
          </div>
        </section>

        <section class="modifier-group">
          <span class="modifier-label"> Stroke Width </span>

          <div class="element-bar-row">
            <For each={Object.entries(STROKE_WIDTH)}>{([key, value]) =>
              <button
                class="nine-yards-button element-modifier-button"
                classList={{ active: commonElement().strokeWidth === value }}
                onclick={() => updateProperty("strokeWidth", value)}
              >
                <img src={`src/assets/svg/weights/${key}.svg`} alt={key} />
              </button>
            }</For>
          </div>
        </section>

        <section class="modifier-group">
          <span class="modifier-label"> Fill Style </span>

          <div class="element-bar-row">
            <For each={["hachure", "cross-hatch", "solid"] as FillStyle[]}>{fill =>
              <button
                class="nine-yards-button element-modifier-button"
                classList={{ active: commonElement().fillStyle === fill }}
                onclick={() => updateProperty("fillStyle", fill)}
              >
                <img src={`src/assets/svg/fill/${fill}.svg`} alt={fill} />
              </button>
            }</For>
          </div>
        </section>

        <section class="modifier-group">
          <span class="modifier-label"> Stroke Style </span>

          <div class="element-bar-row">
            <For each={["dotted", "dashed", "solid"] as StrokeType[]}>{stroke =>
              <button
                class="nine-yards-button element-modifier-button"
                classList={{ active: commonElement().strokeType === stroke }}
                onclick={() => updateProperty("strokeType", stroke)}
              >
                <img src={`src/assets/svg/stroke/${stroke}.svg`} alt={stroke} />
              </button>
            }</For>
          </div>
        </section>
      </section>


      <section class="modifier-group">
        <span class="modifier-label">Fill Colour</span>

        <div class="colour-row">
          <For each={COLOURS}>{colour =>
            <button
              onclick={() => updateProperty("backgroundColor", colour)}
              class="colour-button"
              classList={{ active: commonElement().backgroundColor === colour }}
              style={{ "background-color": colour }}
            ></button>
          }</For>
        </div>
      </section>

      <section class="modifier-group">
        <span class="modifier-label">Stroke Colour</span>

        <div class="colour-row">
          <For each={COLOURS}>{colour =>
            <button
              onclick={() => updateProperty("strokeColor", colour)}
              class="colour-button"
              classList={{ active: commonElement().strokeColor === colour }}
              style={{ "background-color": colour }}
            ></button>
          }</For>
        </div>
      </section>
    </div>
  );
}

export default Customizer;
