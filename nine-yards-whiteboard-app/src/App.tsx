import Toolbar from './components/toolbar';

import { loadFromStorage, saveToStorage } from './lib/storage';
import { STATE_KEY, VIEWPORT_KEY } from './lib/constants';

import { Whiteboard, DEFAULT_VIEWPORT } from 'nine-yards-whiteboard-core';
import { Show, createSignal, onCleanup, onMount } from 'solid-js';

import type { Component } from "solid-js";
import { StateMutation, ViewportMutation } from './lib/types';

const App: Component = () => {
  let canvas: HTMLCanvasElement;
  let [whiteboard, setWhiteboard] = createSignal<Whiteboard>();

  onMount(() => {
    setupCanvas();
  });

  onCleanup(() => {
    const board = whiteboard();

    if (!board) {
      return;
    }

    board.cleanup();
  });

  function saveState(event: StateMutation): void {
    saveToStorage(STATE_KEY, event.state);
  }

  function saveViewport(event: ViewportMutation): void {
    saveToStorage(VIEWPORT_KEY, event.state);
  }

  function setupCanvas(): void {
    console.assert(canvas);

    const elements = loadFromStorage(STATE_KEY, []);
    const viewport = loadFromStorage(VIEWPORT_KEY, DEFAULT_VIEWPORT);

    const board = Whiteboard.on(canvas, { resizeTo: window, elements, viewport });
    setWhiteboard(board);

    board.on("element:mutation", saveState)
    board.on("viewport:mutation", saveViewport);
  }

  return (
    <main>
      <Show when={whiteboard()}>
        <Toolbar whiteboard={whiteboard()!} />
      </Show>

      <canvas ref={canvas!}>
        This browser does not seem to support canvas rendering, please download any
        available updates
      </canvas>
    </main >
  );
};

export default App;
