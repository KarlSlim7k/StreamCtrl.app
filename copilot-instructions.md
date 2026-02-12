# Copilot Instructions for StreamCtrl.app

## Project Overview
StreamCtrl.app is a web-based application designed for managing overlays (lower thirds, supers, titles, timers, etc.) in live streams. It includes features for generating graphics from pre-defined templates, collecting Facebook comments from live transmissions, and providing a control panel within the app. The output is delivered via a URL for the browser. Future expansions include mobile/tablet apps for Android/iOS.

The application must run locally, with easy installation and execution for end-users, packaged as a desktop app using Electron.js.

## Tech Stack
- **Frontend**: React.js for the control panel and overlay rendering.
- **Backend**: Node.js with Express.js for API handling, Socket.io for real-time updates.
- **Database**: SQLite with Sequelize ORM for local data storage.
- **Packaging**: Electron.js for desktop app distribution.
- **Other Libraries**:
  - Chart.js or Recharts for graphics generation.
  - Facebook Graph API SDK for comment collection.
  - Framer Motion for overlay animations.
  - react-countdown-timer for timers.
  - Capacitor.js (future mobile expansion).

## Key Features
1. **Integrated Web-Based Control Panel**: Dashboard for managing all overlay elements in real-time, accessible locally without terminal commands.
2. **Overlay Management**: Create and display lower thirds, supers, titles, and timers with customizable animations.
3. **Automatic Graphics Generation**: Pre-established templates where users input data and graphics are auto-generated (charts, scores, statistics).
4. **Facebook Live Comments Integration**: Authenticate with an admin account via OAuth 2.0 to pull and display live comments from Facebook page transmissions directly as overlays.
5. **URL Output for Browser**: Overlays are emitted via a local URL (e.g., `localhost:3000/overlay`), compatible with OBS, Streamyard, and other streaming software via browser source.
6. **Easy Local Installation**: Installable desktop app (.exe/.dmg) with no technical dependencies for end-users.
7. **Local-First Architecture**: Everything works offline except Facebook API calls (which require internet).
8. **Future Mobile Expansion**: Roadmap for Android/iOS support via Capacitor.js.

## Competitive Differentiators
StreamCtrl.app stands out from competitors (OBS Studio, Streamlabs, TriCaster, CasparCG, Streamyard) by combining:
- All-in-one solution: overlays + graphics generation + social media integration + control panel in a single local app.
- Facebook comments integration with real-time overlay display (unique in the market).
- Low learning curve compared to professional tools like TriCaster or CasparCG.
- Local-first execution without cloud dependency for core features.
- Future mobile/tablet expansion not offered by most competitors.

## Development Guidelines
- Ensure the app works offline except for Facebook API calls (which require internet).
- Prioritize user-friendly installation (e.g., .exe/.dmg installers via electron-builder).
- Follow best practices for security: Encrypt tokens, handle API limits, rotate tokens periodically.
- Use GitHub for version control and automated builds via GitHub Actions.
- Use ESLint for linting, Prettier for formatting, Jest for unit tests, and Cypress for E2E tests.

## Development Roadmap

### Phase 0 — Project Foundation
**Goal**: Development environment ready and functional.
- Initialize repository with folder structure (frontend, backend, electron).
- Configure React.js with Vite or Create React App.
- Configure Node.js with Express and Socket.io.
- Configure SQLite with Sequelize.
- Configure Electron.js for packaging.
- Create basic development scripts (dev, build, package).
- Set up ESLint, Prettier, and testing with Jest.

### Phase 1 — Base Control Panel
**Goal**: Functional dashboard for managing overlay elements.
- Design main control panel interface (layout, navigation).
- CRUD for overlays: create, edit, delete, and list elements (lower thirds, supers, titles).
- Local configuration storage in SQLite.
- Preview system: see how the overlay will look before emitting it.

### Phase 2 — Overlay System and URL Output
**Goal**: Render overlays in real-time accessible via browser URL.
- Create output route (e.g., `localhost:3000/overlay`) that renders active elements.
- Implement WebSockets with Socket.io so the control panel updates overlays in real-time.
- Design overlay components: lower thirds, supers, titles with base styles.
- Integrate Framer Motion for entry/exit overlay animations.
- Implement functional timers/chronometers with panel control.

### Phase 3 — Graphics Generation with Templates
**Goal**: User selects a template, inputs data, and the graphic is auto-generated.
- Design pre-established template system (bars, scores, statistics, etc.).
- Integrate Chart.js or Recharts for dynamic graphic rendering.
- Create panel forms for data input per template.
- Generated graphics must be displayable as overlay via the output URL.
- Save custom templates in SQLite for reuse.

### Phase 4 — Facebook Integration
**Goal**: Connect with Facebook to collect and display live transmission comments.
- Implement OAuth 2.0 flow for login with page admin account.
- Connect with Facebook Graph API to get real-time comments.
- Design panel section to visualize, filter, and select comments.
- Allow sending selected comments as overlay to the output URL.
- Error handling for connection issues, expired tokens, and API limits.

### Phase 5 — Packaging and Distribution
**Goal**: End-user can download, install, and use the app with no technical knowledge.
- Configure electron-builder to generate installers (.exe for Windows, .dmg for macOS).
- Optimize performance and package size.
- Create welcome/onboarding screen for first use.
- Complete end-to-end testing with Cypress.
- Configure GitHub Actions to automate builds on each release.

### Phase 6 — Polish and v1.0 Launch
**Goal**: Stable version ready for real users.
- General QA: fix bugs, improve UX/UI.
- Basic user documentation (quick start guide).
- Performance optimization (memory leaks, CPU usage).
- Create attractive landing page or README for the repo.
- Release v1.0 on GitHub with downloadable installers.

### Phase 7 (Future) — Expansion
- Mobile/tablet support with Capacitor.js (Android/iOS).
- Integration with YouTube and Instagram.
- Community template marketplace.
- Integrated transmission analytics.
- Export/Import configurations between devices.

This document serves as the main context for Copilot to generate further project files, code, and documentation as needed.