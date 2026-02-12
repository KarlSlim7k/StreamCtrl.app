# Copilot Instructions for StreamCtrl.app

## Project Overview
StreamCtrl.app is a web-based application designed for managing overlays (lower thirds, supers, titles, timers, etc.) in live streams. It includes features for generating graphics from pre-defined templates, collecting Facebook comments from live transmissions, and providing a control panel within the app. The output is delivered via a URL for the browser. Future expansions include mobile/tablet apps for Android/iOS.

The application must run locally, with easy installation and execution for end-users, packaged as a desktop app using Electron.js.

## Tech Stack
- **Frontend**: React.js for the control panel and overlay rendering.
- **Backend**: Node.js with Express.js for API handling, Socket.io for real-time updates.
- **Database**: SQLite for local data storage.
- **Packaging**: Electron.js for desktop app distribution.
- **Other Libraries**:
  - Chart.js or Recharts for graphics generation.
  - Facebook Graph API SDK for comment collection.
  - Framer Motion for overlay animations.

## Key Features
1. Overlay Management: Create and display lower thirds, supers, titles, and timers.
2. Graphics Generation: Use templates to input data and auto-generate charts/graphs.
3. Facebook Integration: Authenticate with an admin account to pull live comments from a Facebook page.
4. Control Panel: Web-based dashboard for managing all elements in real-time.
5. Local Execution: Installable desktop app, no external server dependency for core functions.

## Development Guidelines
- Ensure the app works offline except for Facebook API calls (which require internet).
- Prioritize user-friendly installation (e.g., .exe/.dmg installers).
- Follow best practices for security: Encrypt tokens, handle API limits.
- Use GitHub for version control and automated builds via GitHub Actions.

## Next Steps
- Set up the basic React app structure.
- Integrate Node.js backend with Express and Socket.io.
- Implement Facebook login and comment fetching.
- Design overlay rendering logic.
- Package with Electron for local deployment.

This document serves as the initial context for Copilot to generate further project files, code, and documentation as needed.