# JLens
**Paste. Explore. Understand.**

JLens is a modern, privacy-focused universal data explorer designed for developers who value clarity and precision. 
Built with a "Zero-Setup" philosophy, it offers a client-side only environment to validate, visualize, and manipulate data securely.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-green.svg)
![React](https://img.shields.io/badge/react-19-blue)

## ✨ Features

### 🔍 Universal Data Viewer
JLens is no longer just for JSON. It automatically detects and visualizes a wide range of formats:
- **Data**: JSON, YAML, XML, TOML, CSV, INI, ENV
- **Documents**: Markdown (with GFM support), HTML (safe preview)
- **Code**: SQL (syntax highlighting)

### 🧠 Smart Editor
- **Robust formatting**: "Format" and "Minify" buttons work even on invalid/loose input.
- **Experimental Repair**: Automatically fixes common YAML indentation errors (e.g., nested fields under scalar values).
- **Auto-detection**: Intelligent heuristics for discerning loose YAML, ENV files, and Markdown.

### ⚡ Developer Essentials
- **Interactive Tree**: Deeply nested structures are easy to navigate with expand/collapse controls.
- **Type Awareness**: distinct visual indicators for Strings, Numbers, Booleans, Nulls, and Objects.
- **Export**: Download your data as a file or copy to clipboard instantly.
- **Privacy First**: Fully client-side. No API calls, no tracking, no backend.

### 🎨 Modern UI
- **Refined Aesthetic**: Clean, distraction-free interface using `shadcn/ui` principles.
- **Theme Sync**: Automatic Dark/Light mode switching based on system preference.
- **Responsive Layout**: Resizable split-pane view for optimal workspace management.

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3
- **Parsers**: `yaml`, `smol-toml`, `fast-xml-parser`, `papaparse`, `ini`
- **Architecture**: Modular Feature-Sliced structure

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/taoshan98/JLens.git
   cd JLens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Deployment

### GitHub Pages / Static Hosting

This project is configured for static deployment. The `base` path is set to relative (`./`) to support any hosting subdirectory.

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your static host (GitHub Pages, Vercel, Netlify).

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
