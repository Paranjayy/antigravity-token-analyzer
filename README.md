# 🌌 Antigravity Token Analyzer

A high-fidelity, local-first intelligence dashboard for tracking AI usage, token consumption, and execution costs across multiple agentic platforms.

![Design Palace Aesthetic](https://img.shields.io/badge/Design-Palace-purple?style=for-the-badge)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232b.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FParanjayy%2Fantigravity-token-analyzer)

## ✨ Features

- **Multi-Provider Support**: Seamlessly aggregates data from **Antigravity** (NDJSON logs) and **OpenCode** (SQLite databases).
- **Comprehensive Analytics**:
  - **Token Throughput**: Accurate counting using `tiktoken` (cl100k_base).
  - **Financial Tracking**: Real-time cost estimation based on [models.dev](https://models.dev) pricing.
  - **Message Velocity**: Breakdowns of input queries vs assistant responses.
  - **Tool Heatmaps**: Identification of your most-used agentic tools (file edits, terminal commands, etc.).
- **Premium UI**: Dark-mode, glassmorphic dashboard built with Framer Motion, Recharts, and Lucide icons.
- **Local-First**: Zero data leaves your machine. The analyzer runs entirely against your local chat history.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Local installations of Antigravity or OpenCode

### 2. Installation
```bash
git clone https://github.com/Paranjayy/antigravity-token-analyzer.git
cd antigravity-token-analyzer
npm install
```

### 3. Sync Data
The analyzer needs to parse your local logs to generate the dashboard data.
```bash
node src/scripts/analyze.js
```

### 4. Launch Dashboard
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📂 Architecture

- `src/scripts/analyze.js`: The "brain" that crawls local directories and parses various log formats.
- `src/data/stats.json`: The aggregated intelligence layer consumed by the UI.
- `src/data/pricing.json`: A local snapshot of the global model pricing catalog.

## 🛠️ Future Roadmap

- [ ] Support for **OpenAI** / **Anthropic** local export logs.
- [ ] Exportable PDF reports for usage audits.
- [ ] Real-time "Cost-as-you-type" widget for CLI integration.

---
Built with 💜 by Antigravity
