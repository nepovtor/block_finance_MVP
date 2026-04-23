<div align="center">

# MTBlocks

### A mobile-first fintech gamification prototype with a premium banking aesthetic and a block puzzle gameplay loop

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-00D8FF?style=for-the-badge&logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-2563EB?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-7C3AED?style=for-the-badge&logo=vite&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
  <img alt="Zustand" src="https://img.shields.io/badge/Zustand-State-0F172A?style=for-the-badge">
</p>

<p>
  <img alt="Mobile First" src="https://img.shields.io/badge/Mobile-First-F4C542?style=flat-square&labelColor=0B1F5E">
  <img alt="Fintech UI" src="https://img.shields.io/badge/Fintech-UI-0B1F5E?style=flat-square">
  <img alt="Game UX" src="https://img.shields.io/badge/Game-UX-2EC4B6?style=flat-square&labelColor=0B1F5E">
  <img alt="MTB inspired" src="https://img.shields.io/badge/Visual%20Direction-MTB%20Inspired-F4C542?style=flat-square&labelColor=0B1F5E">
</p>

</div>

---

## Concept

**Block Finance MVP** is a concept-driven frontend product that explores how a financial application can increase user engagement through lightweight game mechanics.

The project combines:
- a **fintech-style dashboard**
- a **reward-driven mobile game loop**
- a **Block Blast-inspired puzzle experience**
- a **premium mobile interface** with deep blue and warm yellow accents

The central product hypothesis is simple:

> **financial interaction → reward → game session → score → progression → stronger engagement**

This MVP is designed as a **demo-ready**, **mobile-first**, and **portfolio-grade** prototype.

---

## Product vision

The purpose of the project is not to build just a game and not to build just a banking screen.

The idea is to model a hybrid surface where:
- financial activity feels more rewarding
- mobile sessions are short and emotionally engaging
- progression is visible and motivating
- the interface feels premium, compact, and modern

This makes the project especially useful as:
- a hackathon presentation
- a frontend portfolio case
- a gamified fintech prototype
- a product concept for engagement mechanics inside a banking ecosystem

---

## Core product loop

The current MVP is built around the following loop:

1. **User enters the product flow**
2. **A reward state is shown**
3. **The user starts a mobile game session**
4. **The user places puzzle shapes on the board**
5. **Rows and columns are cleared for score**
6. **The session ends with score banking / replay / extra move**
7. **Progression and future achievement layers can build on top of this**

This structure makes the product easy to understand and easy to demonstrate.

---

## Key features

### 1. Mobile-first game interface
- responsive board layout
- sticky bottom tray for available pieces
- touch-oriented piece placement
- drag ghost rendering
- compact header and score display

### 2. Fintech-inspired visual design
- premium dark blue background
- subtle glass / blur surfaces
- controlled yellow reward accents
- restrained but expressive animation language
- modern banking aesthetic instead of arcade styling

### 3. Block puzzle gameplay
- piece selection and drag placement
- placement preview
- invalid placement feedback
- row and column clear logic
- game-over flow with replay options

### 4. Reward mechanics
- extra move support
- score banking
- repeatable session loop
- replay after session end

### 5. Combo bonus system
The project includes a lightweight combo mechanic:
- consecutive line clears build a combo streak
- at 3 consecutive clear turns the player receives **+100 bonus points**
- after that, continued combo clears grant **+150 bonus points**

This improves the sense of skill progression without overcomplicating gameplay.

---

## Achievement direction

The interface is designed to support milestone-based progression.

The current product direction includes large achievement thresholds such as:
- **5,000**
- **15,000**
- **45,000**
- **100,000**

This structure allows the UI to evolve toward:
- compact progress indicators
- badge-based reward tiers
- milestone icons
- premium branded achievements for top tiers

The 100,000 threshold can serve as a major branded milestone.

---

## Why this project matters

This repository demonstrates more than a styled interface.

It shows the ability to:
- think in **product mechanics**, not just components
- build **mobile-first interaction flows**
- combine **gameplay** with **fintech UX**
- structure frontend logic into hooks and UI modules
- deliver a project that is both **demo-friendly** and **portfolio-relevant**

From an engineering perspective, the project reflects work in several dimensions:
- UI composition
- interaction logic
- game state management
- mobile usability
- architectural cleanup
- product framing

---

## Tech stack

### Frontend
- **React 18**
- **TypeScript**
- **Vite**
- **React Router DOM**
- **Zustand**

### Styling
- **Tailwind CSS**
- **PostCSS**
- **Autoprefixer**

### Architectural patterns
- page-level orchestration
- custom hooks for interaction logic
- game UI broken into focused components
- strongly typed state and props

---

## Architecture overview

The project has been progressively refactored from a single large game page into a more maintainable structure.

### Main modules
- `GamePage.tsx` — session orchestration and high-level game flow
- `GameHeader.tsx` — top game information area
- `GameBoard.tsx` — board rendering and placement surface
- `PieceTray.tsx` — mobile bottom tray with pieces and actions
- `DragGhost.tsx` — drag visual layer
- `GameOverModal.tsx` — end-of-run actions
- `useGameDrag.ts` — touch / drag interaction logic
- `useClearedCellEffects.ts` — clear animations and related state

### Result
This makes the codebase easier to:
- read
- extend
- debug
- present as a serious frontend project

---

## Repository structure

```text
frontend_block_finance_mvp/
├── src/
│   ├── components/
│   │   └── game/
│   │       ├── DragGhost.tsx
│   │       ├── GameBoard.tsx
│   │       ├── GameHeader.tsx
│   │       ├── GameOverModal.tsx
│   │       └── PieceTray.tsx
│   ├── hooks/
│   │   ├── useClearedCellEffects.ts
│   │   └── useGameDrag.ts
│   ├── game/
│   │   └── engine.ts
│   ├── pages/
│   │   └── GamePage.tsx
│   ├── services/
│   ├── store/
│   └── styles/
├── package.json
└── vite.config.*