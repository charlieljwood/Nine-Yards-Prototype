#!/usr/bin/env just --justfile

@_default:
    {{ just_executable() }} --list --unsorted

@build-lib *args:
    cd packages/nine-yards-whiteboard-core && pnpm run build {{args}}

@run-lib *args:
    cd packages/nine-yards-whiteboard-core && pnpm run dev {{args}}

@build-app *args: build-lib install-workspace
    cd nine-yards-whiteboard-app && pnpm run build {{args}}

@run-app *args: build-lib install-workspace
    cd nine-yards-whiteboard-app && pnpm run dev {{args}}

@install-workspace *args:
    pnpm install
