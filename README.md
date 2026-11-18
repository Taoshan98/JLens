# JLens
**Paste. Explore. Understand.**

JLens is a modern, privacy-focused universal data explorer designed for developers who value clarity and precision.
Built with a "Zero-Setup" philosophy, it offers a 100% client-side environment to validate, format, convert, and explore data securely.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.3.0-green.svg)
![React](https://img.shields.io/badge/react-19-blue)

## ✨ Features

### 🔍 Universal Data Explorer
Automatically detects (via bounded O(1) sampling) and visualizes 12 formats:
- **Structured Data**: JSON, JSONL (NDJSON), YAML, XML, TOML, CSV (comma, semicolon, tab), INI, ENV
- **Documents**: Markdown (with GFM tables & syntax highlighting), HTML (strictly isolated `<iframe sandbox="">` preview)
- **Code & Text**: SQL (syntax highlighting), Plain Text

### 🔄 Cross-Format Converter & Power Views
- **Instant Conversion**: Convert any parsed structured dataset on the fly between `JSON ↔ YAML ↔ TOML ↔ XML ↔ CSV ↔ INI ↔ ENV ↔ JSONL`.
- **Interactive Tree**: Expand/Collapse All controls, progressive rendering for huge collections, RFC 6901 collision-free paths, keyboard navigation, and deep match search (`Enter` / `Shift+Enter`).
- **Node Inspector**: One-click copy for **JSONPath** (`$.a.b`), **jq** (`.a.b`), and **Value**.
- **Interactive Data Table**: Natural sorting, live search filtering, pagination, click-to-copy cells, and automatic single-array unwrapping (e.g., XML lists).
- **TypeScript & JSON Schema Generator**: Live inference of TypeScript interfaces and Draft 2020-12 JSON Schemas with customizable root type name.

### 🧠 Smart Privacy-First Editor
- **Explicit Input Control**: Explicit **Paste** button, **Open File**, **Drag & Drop** support, and one-click **Sample** loader (no silent background clipboard reads).
- **Format, Minify & Repair**: String-aware SQL minification, `<pre>`/`<code>`-safe HTML formatting/minification, experimental YAML indentation repair, and memory-bounded **Undo** history for programmatic edits.
- **Virtualized Gutter**: Smooth scrolling with minimal DOM footprint even on massive files.
- **Lazy-Loaded Parsers**: Heavy format libraries are dynamically code-split on demand for fast initial startup.
- **Privacy First**: Fully client-side. No API calls, no tracking, no backend.

### 🎨 Modern Responsive UI
- **Theme Sync**: Automatic Dark/Light/System theme switching persisted locally.
- **Accessible Split Workspace**: Keyboard- and pointer-resizable split panes on desktop, plus a seamless Editor/Viewer tab switcher on mobile screens.

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript (strict)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **Testing**: Vitest 5
- **Parsers & Highlighting**: `yaml`, `smol-toml`, `fast-xml-parser`, `papaparse`, `ini`, `sql-formatter`, `dompurify`, `react-markdown`, `react-syntax-highlighter` (`PrismLight`)

## 🚀 Getting Started

### Prerequisites

- Node.js (v22.12+ or v24 LTS recommended)
- npm

### Installation & Commands

1. Clone the repository:
   ```bash
   git clone https://github.com/taoshan98/JLens.git
   cd JLens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Available scripts:
   - `npm run dev` — start the Vite development server ([http://localhost:5173](http://localhost:5173))
   - `npm run lint` — run ESLint across the codebase
   - `npm test` — run the Vitest unit test suite
   - `npm run build` — run TypeScript type checking (`tsc -b`) and build `dist/`

## 📦 Deployment

### GitHub Pages & Automated Releases

This project is configured for static deployment with relative `base: './'`.
Pushes to `main` automatically run `npm ci`, `npm audit --audit-level=high`, `npm run lint`, `npm test`, and `npm run build` via [deploy.yml](.github/workflows/deploy.yml), deploy to GitHub Pages, and publish a GitHub Release with `jlens-v<version>-dist.zip` whenever `package.json` introduces a new version.

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
