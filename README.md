# JLens
**Paste. Explore. Understand.**

JLens is a modern, privacy-focused JSON explorer designed for developers who value clarity and precision. 
Built with a "Zero-Setup" philosophy, it offers a client-side only environment to validate, visualize, and manipulate JSON data securely.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![React](https://img.shields.io/badge/react-19-blue)

## ✨ Features

- **Real-time Validation**: Instant feedback on JSON syntax errors.
- **Interactive Tree View**: Collapsible/expandable nodes for easy navigation of deep structures.
- **Smart Toolbar**:
  - **Prettify**: Format minified JSON instantly.
  - **Minify**: Compress JSON for transport.
  - **Copy**: One-click clipboard persistence.
  - **Download**: Export your work as `.json`.
- **Theme Awareness**: Built-in Dark Mode, Light Mode, and System Sync.
- **Privacy First**: No server, no backend. Your data never leaves your browser.

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Architecture**: Feature-Sliced Design (FSD) inspired

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/JLens.git
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

### GitHub Pages

Value `base: './'` is already configured in `vite.config.ts` to support relative paths.

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your static host or gh-pages branch.

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
