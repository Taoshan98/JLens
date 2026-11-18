# JLens — Bugfix, Enhancement & Optimization Plan

## Phase 1: Cleanup, Dependencies, Bugfixes & Power-Tools (Committed)
- [x] Remove unused `js-yaml` / `@types/js-yaml` and dead files (`useJsonValidation.ts`, `features/editor/types.ts`)
- [x] Fix React Rules of Hooks crash in `UniversalViewer.tsx` & RegExp escape in `HighlightText.tsx`
- [x] Harden HTML preview (`<iframe sandbox="" srcDoc>`) and `index.html` CSP/favicon
- [x] Fix `FormatManager` detection/parsing/formatting/minifying bugs and add cross-format conversion, Data Table, TS/JSON Schema generator, and JSONPath/jq tools

## Phase 2: Dependency Security, Atomic Architecture & Performance (Committed)
- [x] Upgrade vulnerable/outdated packages (`fast-xml-parser`, `dompurify`, `smol-toml`, `yaml`, `vitest` v5, etc.) and reach 0 `npm audit` vulnerabilities
- [x] Remove `js-beautify` (replaced with pure-TS `htmlHandler`) and `react-split` (replaced with accessible pointer/keyboard `ResizableSplit`)
- [x] Split `formatManager.ts` into `src/formats/` (`detector.ts`, `converter.ts`, and lazy-loaded handlers) with `O(1)` bounded detection and single-pass `detectAndParseAsync`
- [x] Import `PrismLight` directly from `prism-light` without barrel overhead
- [x] Add subtree-aware `React.memo` on `JsonNode`, virtualized `EditorGutter`, memory-bounded `useEditorHistory`, `Set`-based `O(1)` schema deduplication, cached `HighlightText` regexes, Schwartzian sort in `useTableData`, and `useCopyFeedback`

## Phase 3: CI/CD Hardening, Documentation & v1.3.0 Release Prep
- [x] Harden `.github/workflows/deploy.yml` with least-privilege permissions, PR CI validation, branch guards, safe deployment concurrency, `npm audit --audit-level=high`, `gh release view` check, and `jlens-v<tag>-dist.zip` release attachment
- [x] Bump `package.json` and `package-lock.json` to `1.3.0` and reference `__APP_VERSION__` in `SAMPLE_JSON`
- [x] Update `README.md` with `v1.3.0` features, formats, Node prerequisites, and scripts
