# JLens — Bugfix & Enhancement Plan

## Phase 1: Cleanup, Dependencies & Static Config
- [x] Remove unused `js-yaml` / `@types/js-yaml` and move type packages to `devDependencies`
- [x] Add `vitest` and `test` / `test:watch` scripts
- [x] Remove dead files (`useJsonValidation.ts`, `features/editor/types.ts`)
- [x] Fix `index.html` favicon relative path and CSP `img-src` / `frame-src`
- [x] Add `npm run lint` and `npm test` to `.github/workflows/deploy.yml`
- [x] Update `vite.config.ts` manual chunks (`smol-toml`, `ini`)

## Phase 2: Core Utilities & FormatManager Overhaul
- [x] Implement RFC 6901 JSON Pointer & JSONPath/jq helpers (`src/utils/jsonPath.ts`)
- [x] Implement TypeScript & JSON Schema generator (`src/utils/typeGenerator.ts`)
- [x] Overhaul `FormatManager` (`detect`, `parse`, `stringify`, `minify`, `convert`) with strict types, XML validation, CSV/JSONL auto-detection, safe SQL/HTML minification, and ENV/JSONL round-tripping

## Phase 3: Viewer Fixes & Power-User Enhancements
- [x] Fix React Rules of Hooks crash in `UniversalViewer.tsx`
- [x] Escape RegExp metacharacters in `HighlightText.tsx`
- [x] Refactor `useJsonSearch.ts` to pure `useMemo` + RFC 6901 paths
- [x] Enhance `JsonNode.tsx` & `JsonTree.tsx` (Expand/Collapse All, progressive rendering, keyboard accessibility, selectable text, Purple Ban compliance)
- [x] Fix `NodeDetailPanel.tsx` (null type, dead code removal, Copy JSONPath / jq / Value)
- [x] Add `DataTableView.tsx` and `SchemaView.tsx`
- [x] Harden `DocumentPreview.tsx` (`PrismLight` lazy loading, SQL highlighting, sandboxed `iframe` for HTML)

## Phase 4: Editor, Privacy, Layout & Verification
- [x] Replace silent clipboard auto-paste with explicit Paste, Open File, Drag & Drop, Sample, Undo, and Cross-Format Converter
- [x] Fix editor gutter ref, dynamic width, scrollbar padding, format-aware download/tooltips
- [x] Add `ErrorBoundary.tsx`, split `useTheme.ts`, add `.gutter` styles & reduced motion in `index.css`
- [x] Make `App.tsx` / `Layout.tsx` responsive for mobile and desktop
- [x] Add Vitest suites and verify `npm run lint`, `npx tsc -b`, `npm test`, `npm run build`
