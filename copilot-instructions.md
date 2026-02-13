# Copilot Instructions for StreamCtrl.app

> **Purpose**: This document provides comprehensive guidelines, specifications, and best practices for developing StreamCtrl.app. All AI-assisted code generation and architectural decisions must strictly follow these instructions.

## How to Use This Document

### For Copilot AI
- **Always reference these instructions** before generating code, suggesting changes, or making architectural decisions
- **Prioritize consistency** with the specified tech stack, patterns, and conventions
- **Follow the phase-based roadmap** when implementing new features
- **Adhere to quality metrics** defined in this document
- **When uncertain**, ask clarifying questions rather than assuming
- **Delivery method upon completion***, Briefly provide the code modifications made. Also, if you generate new documentation that is not previously declared in the necessary documentation, avoid doing so and only respond briefly in the chat to optimize token usage with AI.

### For Developers
- Review this document before starting work on any feature
- Use as reference for coding standards and architectural patterns
- Update this document when making significant architectural changes
- Ensure all PRs align with guidelines specified here

## Project Overview
StreamCtrl.app is a web-based application designed for managing overlays (lower thirds, supers, titles, timers, etc.) in live streams. It includes features for generating graphics from pre-defined templates, collecting Facebook comments from live transmissions, and providing a control panel within the app. The output is delivered via a URL for the browser. Future expansions include mobile/tablet apps for Android/iOS.

The application must run locally, with easy installation and execution for end-users, packaged as a desktop app using Electron.js.

## Tech Stack
- **Language**: TypeScript for type safety and better developer experience across frontend and backend.
- **Frontend**: React.js with Vite for the control panel and overlay rendering.
- **State Management**: Zustand for global state management (lightweight alternative to Redux).
- **Backend**: Node.js with Express.js for API handling, Socket.io for real-time updates.
- **Database**: SQLite with better-sqlite3 for lightweight, synchronous local data storage.
- **Packaging**: Electron.js for desktop app distribution.
- **Other Libraries**:
  - Chart.js or Recharts for graphics generation.
  - Native fetch API for Facebook Graph API calls (no SDK to reduce bundle size).
  - Framer Motion for overlay animations.
  - react-countdown-timer for timers.
  - node-onvif or viscajs for PTZ camera control (VISCA, Pelco-D, ONVIF protocols).
  - Capacitor.js (future mobile expansion).

## Key Features
1. **Integrated Web-Based Control Panel**: Dashboard for managing all overlay elements in real-time, accessible locally without terminal commands.
2. **Overlay Management**: Create and display lower thirds, supers, titles, and timers with customizable animations.
3. **Automatic Graphics Generation**: Pre-established templates where users input data and graphics are auto-generated (charts, scores, statistics).
4. **Facebook Live Comments Integration**: Authenticate with an admin account via OAuth 2.0 to pull and display live comments from Facebook page transmissions directly as overlays.
5. **URL Output for Browser**: Overlays are emitted via a local URL (e.g., `localhost:3000/overlay`), compatible with OBS, Streamyard, and other streaming software via browser source.
6. **Easy Local Installation**: Installable desktop app (.exe/.dmg) with no technical dependencies for end-users.
7. **Local-First Architecture**: Everything works offline except Facebook API calls (which require internet).
8. **PTZ Camera Control**: Direct control of PTZ cameras via VISCA, Pelco-D, ONVIF, and HTTP protocols from the control panel.
9. **Future Mobile Expansion**: Roadmap for Android/iOS support via Capacitor.js.

## Competitive Differentiators
StreamCtrl.app stands out from competitors (OBS Studio, Streamlabs, TriCaster, CasparCG, Streamyard) by combining:
- All-in-one solution: overlays + graphics generation + social media integration + control panel in a single local app.
- Facebook comments integration with real-time overlay display (unique in the market).
- Low learning curve compared to professional tools like TriCaster or CasparCG.
- Local-first execution without cloud dependency for core features.
- Future mobile/tablet expansion not offered by most competitors.

## Project Architecture

### Folder Structure
```
StreamCtrl.app/
├── electron/              # Electron main process
│   ├── main.ts           # Entry point
│   ├── preload.ts        # Preload script
│   └── ipc-handlers.ts   # IPC communication
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page-level components
│   │   ├── stores/       # Zustand stores
│   │   ├── types/        # TypeScript types
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utility functions
│   │   ├── api/          # API client functions
│   │   └── App.tsx       # Main app component
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── routes/       # Express routes
│   │   ├── controllers/  # Route controllers
│   │   ├── services/     # Business logic
│   │   ├── models/       # Database models
│   │   ├── middleware/   # Express middleware
│   │   ├── socket/       # Socket.io handlers
│   │   ├── utils/        # Utility functions
│   │   └── server.ts     # Entry point
│   └── tsconfig.json
├── shared/               # Shared types between frontend/backend
│   └── types/
├── package.json
└── README.md
```

### Technical Specifications
- **Frontend Port**: 3000 (Vite dev server)
- **Backend Port**: 3001 (Express)
- **Overlay Route**: `http://localhost:3001/overlay`
- **Control Panel Route**: `http://localhost:3000`
- **Database Location**: `userData/streamctrl.db` (Electron userData directory)
- **Logs Location**: `userData/logs/`

### Database Schema
```typescript
// Overlays table
interface Overlay {
  id: string;
  type: 'lower-third' | 'super' | 'title' | 'timer';
  name: string;
  content: Record<string, any>;
  styles: Record<string, any>;
  animation: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Templates table
interface Template {
  id: string;
  name: string;
  type: 'chart' | 'score' | 'statistics';
  config: Record<string, any>;
  thumbnail?: string;
  createdAt: number;
}

// Settings table
interface Settings {
  key: string;
  value: string;
}
```

## Development Guidelines

### Code Standards
- **Naming Conventions**:
  - Components: PascalCase (`OverlayPanel.tsx`)
  - Files: kebab-case (`overlay-service.ts`)
  - Variables/functions: camelCase (`getUserData()`)
  - Constants: UPPER_SNAKE_CASE (`MAX_OVERLAYS`)
  - Interfaces/Types: PascalCase with descriptive names (`OverlayConfig`)

- **TypeScript**:
  - Use strict mode (`"strict": true`)
  - Avoid `any`; use `unknown` if type is truly unknown
  - Define interfaces for all data structures
  - Use type guards for runtime type checking
  - Export types from shared package for cross-module consistency

- **Component Structure**:
  - Functional components only
  - Custom hooks for reusable logic
  - Keep components under 250 lines
  - One component per file
  - Co-locate styles if using CSS modules

- **State Management**:
  - Use Zustand stores for global state (overlays, settings, FB connection)
  - Use local state (`useState`) for UI-only state
  - Avoid prop drilling; use stores or context for deep hierarchies
  - Keep stores focused (one store per domain: overlays, templates, settings)

### Error Handling
- **Frontend**:
  - Wrap API calls in try-catch blocks
  - Show user-friendly error messages (avoid technical jargon)
  - Use error boundaries for component errors
  - Log errors to console in development, to file in production

- **Backend**:
  - Global error handler middleware
  - Validate all inputs with proper error responses
  - Return structured error objects: `{ error: string, code: string }`
  - Log errors with timestamps and stack traces
  - Graceful shutdown on critical errors

### Security Best Practices
- **Token Management**:
  - Store Facebook tokens in electron-store with encryption
  - Never expose tokens in frontend code
  - Implement token refresh logic before expiration
  - Clear tokens on logout

- **API Security**:
  - Validate all inputs (sanitize user data)
  - Rate limiting for API endpoints
  - CORS configuration for local-only access
  - No hardcoded credentials

- **Electron Security**:
  - Enable context isolation
  - Disable Node integration in renderer
  - Use IPC for backend communication only
  - Sanitize all external content (Facebook comments)

### Testing Strategy
- **Unit Tests** (Jest):
  - All utility functions
  - All stores (Zustand)
  - All services (business logic)
  - Target: 80% coverage

- **Component Tests** (React Testing Library):
  - All interactive components
  - Test user interactions, not implementation
  - Mock API calls and stores

- **E2E Tests** (Cypress):
  - Critical user flows (create overlay, display overlay, FB login)
  - Test in packaged Electron app
  - Run before each release

- **Integration Tests**:
  - Socket.io communication
  - Database operations
  - Facebook API integration (with mocks)

### Performance Guidelines
- **Frontend**:
  - Lazy load routes with React.lazy
  - Memoize expensive computations with useMemo
  - Debounce user inputs (search, text fields)
  - Optimize re-renders with React.memo
  - Use virtual scrolling for long lists

- **Backend**:
  - Use database indexes for frequent queries
  - Cache Facebook API responses (5-10 seconds)
  - Batch database operations when possible
  - Optimize Socket.io events (throttle high-frequency updates)

- **Electron**:
  - Keep bundle size under 150MB
  - Lazy load heavy dependencies
  - Optimize images and assets
  - Use WebP for graphics
  - Implement auto-updates incrementally

### Git Workflow
- **Branch Strategy**:
  - `main`: stable releases only
  - `develop`: integration branch
  - `feature/*`: new features
  - `fix/*`: bug fixes
  - `release/*`: release preparation

- **Commit Messages**:
  - Format: `type(scope): message`
  - Types: feat, fix, docs, style, refactor, test, chore
  - Example: `feat(overlay): add timer component`
  - Keep messages under 72 characters

- **Pull Requests**:
  - Require at least one approval
  - All tests must pass
  - Include description of changes
  - Reference related issues

### Development Tools
- **ESLint**: Use `@typescript-eslint` with strict rules
- **Prettier**: Format on save, 2-space indentation
- **Husky**: Pre-commit hooks for linting and tests
- **VSCode Extensions**: ESLint, Prettier, TypeScript, Git Graph
- **Debugging**: Use VSCode debugger for both Electron and Node.js

## Design Patterns & Architecture

### Component Patterns
- **Container/Presentational Pattern**:
  - Container components handle logic and state
  - Presentational components handle UI rendering
  - Example: `OverlayListContainer` wraps `OverlayList`

- **Compound Components**:
  - For complex UI like overlay editors
  - Share state implicitly through context
  - Example: `OverlayEditor.Header`, `OverlayEditor.Body`, `OverlayEditor.Footer`

- **Custom Hooks**:
  - `useOverlay(id)`: Get and manage single overlay
  - `useOverlays()`: Get all overlays with CRUD operations
  - `useSocket()`: Socket.io connection and event handling
  - `useFacebookAuth()`: OAuth flow and token management
  - `useDebounce(value, delay)`: Debounce user inputs

### Service Layer Pattern
All business logic resides in services, not controllers:
- `overlay.service.ts`: CRUD operations, validation
- `template.service.ts`: Template management
- `facebook.service.ts`: API calls, token refresh
- `socket.service.ts`: Broadcast events, room management
- `database.service.ts`: SQLite operations wrapper

### Event-Driven Architecture (Socket.io)
```typescript
// Event naming convention: domain:action
interface SocketEvents {
  // Overlay events
  'overlay:create': (overlay: Overlay) => void;
  'overlay:update': (id: string, data: Partial<Overlay>) => void;
  'overlay:delete': (id: string) => void;
  'overlay:activate': (id: string) => void;
  'overlay:deactivate': (id: string) => void;
  
  // Timer events
  'timer:start': (id: string) => void;
  'timer:pause': (id: string) => void;
  'timer:reset': (id: string) => void;
  
  // Facebook events
  'facebook:comment': (comment: Comment) => void;
  'facebook:connected': () => void;
  'facebook:disconnected': () => void;
}
```

### Database Operations
- Use transactions for multi-step operations
- Implement migrations for schema changes
- Backup database before version updates
- Index frequently queried fields (`id`, `type`, `isActive`)

## API Specifications

### REST Endpoints
```
GET    /api/overlays              # List all overlays
GET    /api/overlays/:id          # Get single overlay
POST   /api/overlays              # Create overlay
PUT    /api/overlays/:id          # Update overlay
DELETE /api/overlays/:id          # Delete overlay

GET    /api/templates             # List all templates
POST   /api/templates             # Create template
DELETE /api/templates/:id         # Delete template

GET    /api/settings              # Get all settings
PUT    /api/settings/:key         # Update setting

POST   /api/facebook/auth         # Initiate OAuth flow
GET    /api/facebook/callback     # OAuth callback
GET    /api/facebook/comments     # Get live comments
POST   /api/facebook/disconnect   # Disconnect FB account
```

### Socket.io Rooms
- `overlay-output`: Room for overlay display clients
- `control-panel`: Room for control panel clients
- Clients subscribe to rooms based on their role
- Broadcast events only to relevant rooms

### Facebook Graph API Integration
```typescript
// Required permissions
const FB_PERMISSIONS = [
  'pages_read_engagement',
  'pages_manage_posts',
  'pages_read_user_content'
];

// API endpoints used
const FB_ENDPOINTS = {
  liveVideos: '/{page-id}/live_videos',
  comments: '/{video-id}/comments',
  me: '/me/accounts'
};

// Polling strategy
// - Poll every 2 seconds during active streaming
// - Use long-lived tokens (60 days)
// - Implement exponential backoff on errors
```

## UI/UX Guidelines

### Design Principles
- **Clarity**: Every action should be obvious
- **Feedback**: Immediate visual feedback for all actions
- **Consistency**: Uniform components and interactions
- **Accessibility**: Keyboard navigation, ARIA labels
- **Performance**: Max 100ms response time for UI actions

### Typography & Colors
- Primary font: Inter or System UI
- Monospace: for code/technical data
- Color palette: Define in CSS variables
- Dark mode support from start
- High contrast ratios (WCAG AA minimum)

### Overlay Design Standards
- **Lower Thirds**:
  - Height: 120-150px
  - Position: bottom-left or bottom-center
  - Animation: slide from left (300ms)
  - Stay duration: 5-10 seconds default

- **Supers**:
  - Smaller than lower thirds (80-100px)
  - Position: top-right or top-left
  - Animation: fade in (200ms)
  - Stay duration: 3-5 seconds default

- **Titles**:
  - Full width, centered
  - Position: top or bottom third
  - Animation: scale + fade (400ms)
  - Stay duration: configurable

- **Timers**:
  - Fixed size: 200x80px typical
  - Position: top-right corner
  - Font: monospace for clarity
  - Update frequency: 100ms minimum

### Control Panel Layout
- **Sidebar Navigation**: Overlays, Templates, Facebook, Settings
- **Main Content Area**: Context-specific panels
- **Preview Pane**: Real-time overlay preview (optional split view)
- **Quick Actions**: Floating action button for common tasks

## Deployment & Release

### Build Process
```bash
# Development
npm run dev              # Start all services
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only
npm run dev:electron     # Electron only

# Testing
npm run test            # All tests
npm run test:unit       # Unit tests only
npm run test:e2e        # E2E tests only
npm run lint            # Linting
npm run type-check      # TypeScript check

# Production
npm run build           # Build all
npm run package         # Package Electron app
npm run package:win     # Windows installer
npm run package:mac     # macOS installer
npm run package:linux   # Linux AppImage
```

### GitHub Actions Workflow
```yaml
# On push to main/develop
- Lint and type-check
- Run unit tests
- Run E2E tests
- Build application

# On release tag
- Run all tests
- Build for all platforms
- Create GitHub release
- Upload installers as assets
- Generate release notes
```

### Versioning
- Follow Semantic Versioning (SemVer)
- Format: `v{major}.{minor}.{patch}`
- Example: `v1.0.0`, `v1.1.0`, `v1.1.1`
- Auto-update within same major version

### Release Checklist
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Performance profiling complete
- [ ] Database migrations tested
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version numbers bumped
- [ ] Installers tested on target OS
- [ ] Auto-update tested
- [ ] Rollback plan documented

## Electron-Specific Guidelines

### IPC Communication
```typescript
// Main process (electron/ipc-handlers.ts)
ipcMain.handle('database:query', async (event, sql, params) => {
  return database.query(sql, params);
});

// Renderer process (frontend)
const result = await window.electron.database.query(sql, params);
```

### Process Separation
- **Main Process**: Database, file system, native APIs
- **Renderer Process**: UI only, no Node.js access
- **Preload Script**: Bridge between main and renderer
- Never share state directly between processes

### Window Management
- Main window: Control panel (hidden when minimized to tray)
- Preview window: Optional, shows overlay output
- Use `BrowserWindow` visibility events for optimization
- Implement window state persistence (size, position)

### Auto-Updates
```typescript
// Use electron-updater
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();
autoUpdater.on('update-available', () => {
  // Notify user
});
```

### Native Menus & Tray
- System tray icon for quick access
- Context menu: Show/Hide, Quit
- Application menu: File, Edit, View, Help
- Keyboard shortcuts for common actions

### Development vs Production
```typescript
const isDev = process.env.NODE_ENV === 'development';

// Different behavior based on environment
if (isDev) {
  win.webContents.openDevTools();
  win.loadURL('http://localhost:3000');
} else {
  win.loadFile('dist/index.html');
}
```

## Common Issues & Solutions

### Database Lock Issues
- **Problem**: SQLite database locked during concurrent operations
- **Solution**: Use WAL mode, implement retry logic, serialize writes

### Socket.io Connection Drops
- **Problem**: Connection lost during network changes
- **Solution**: Implement reconnection logic, show connection status in UI

### Facebook Token Expiration
- **Problem**: Tokens expire and API calls fail
- **Solution**: Implement token refresh before expiration, graceful degradation

### Memory Leaks in Overlays
- **Problem**: Long-running overlays consume too much memory
- **Solution**: Clean up intervals/timers, remove event listeners, limit animation frames

### Large Bundle Size
- **Problem**: Electron app exceeds 200MB
- **Solution**: Code splitting, dynamic imports, compress assets, exclude dev dependencies

### Cross-Platform Font Rendering
- **Problem**: Fonts look different on Windows/Mac/Linux
- **Solution**: Use web fonts, test on all platforms, provide fallbacks

## Monitoring & Analytics

### Error Tracking
- Log all errors to local file
- Structured logging with timestamp, level, message, stack
- Rotate logs daily, keep last 7 days
- Optional: Integrate Sentry for production error tracking

### Performance Metrics
- Track app startup time (target: < 3 seconds)
- Monitor memory usage (target: < 200MB idle)
- Socket.io latency (target: < 50ms)
- Overlay render time (target: < 16ms / 60fps)

### User Analytics (Privacy-First)
- Count feature usage (anonymous, local only)
- Track common user flows
- Identify unused features for removal
- No PII collection, no external tracking

## Documentation Requirements

### Code Documentation
- All public functions must have JSDoc comments
- Complex algorithms need inline comments
- README in each major subdirectory
- API documentation auto-generated from types

### User Documentation
- Quick start guide (< 5 minutes to first overlay)
- Feature tutorials with screenshots
- Troubleshooting section
- FAQ based on common issues
- Video tutorials for complex features

### Developer Documentation
- Setup instructions for new contributors
- Architecture overview with diagrams
- API reference
- Testing guide
- Deployment guide

## Future Considerations (Phase 7+)

### Mobile App Strategy
- Use Capacitor.js for native wrapper
- Share business logic with desktop app
- Responsive design for tablets
- Simplified UI for mobile screens
- Read-only mode for phones, full control on tablets

### Additional Integrations
- **YouTube Live**: Similar to Facebook, real-time chat
- **Instagram Live**: Stories integration, comment display
- **Twitch**: Chat overlay, follower notifications
- **Twitter/X**: Hashtag tracking, tweet display

### Cloud Features (Optional)
- Cloud backup for overlays/templates
- Sync across devices
- Shared template library
- Collaborative overlay editing
- All cloud features optional, app works fully offline

### Advanced Graphics
- 3D graphics with Three.js
- Video backgrounds
- Particle effects
- Green screen support
- Multi-layer overlays

### Plugin System
- Third-party plugins for custom overlays
- Plugin marketplace
- API for plugin developers
- Sandboxed execution environment

### AI Features
- Auto-generate graphics from natural language
- Smart comment filtering (toxicity, relevance)
- Automatic highlight detection
- Predictive text for overlays

## Quality Metrics & KPIs

### Code Quality
- Test coverage: > 80%
- TypeScript strict mode: 100%
- ESLint errors: 0
- Bundle size: < 150MB
- Dependencies: Keep under 50 direct dependencies

### Performance Benchmarks
- App startup: < 3 seconds
- Overlay activation: < 100ms
- Socket latency: < 50ms
- Memory usage: < 200MB idle, < 500MB active
- CPU usage: < 5% idle, < 30% active

### User Experience
- Time to first overlay: < 5 minutes
- Learning curve: < 30 minutes for basic features
- Crash rate: < 0.1%
- User satisfaction: > 4.5/5 stars

## Contribution Guidelines

### For External Contributors
- Fork the repository and create a feature branch
- Follow all coding standards and conventions
- Write tests for new features
- Update documentation as needed
- Submit a pull request with clear description

### Code Review Process
- All code must be reviewed by at least one maintainer
- Automated tests must pass
- Code must meet quality metrics (coverage, linting)
- Documentation must be updated
- Performance impact must be assessed

### Issue Reporting
- Use GitHub Issues for bug reports and feature requests
- Provide clear reproduction steps for bugs
- Include system information (OS, version, logs)
- Check for existing issues before creating new ones

## License & Legal

### Recommended License
- **MIT License** for maximum adoption and flexibility
- Clearly state license in README and each source file
- Include `LICENSE` file in repository root

### Third-Party Dependencies
- Document all dependencies and their licenses
- Ensure license compatibility
- Regularly audit for security vulnerabilities
- Keep dependencies up to date

### User Privacy
- No data collection without explicit user consent
- Store all user data locally by default
- Clearly document what data is stored and where
- Provide data export functionality
- GDPR-friendly by design

## Development Roadmap

### Phase 0 — Project Foundation
**Goal**: Development environment ready and functional.
- Initialize repository with folder structure (frontend, backend, electron).
- Configure React.js with TypeScript using Vite.
- Configure Node.js with TypeScript, Express and Socket.io.
- Configure SQLite with better-sqlite3.
- Set up Zustand for state management.
- Configure Electron.js for packaging.
- Create basic development scripts (dev, build, package).
- Set up ESLint, Prettier, and testing with Jest.

### Phase 1 — Base Control Panel
**Goal**: Functional dashboard for managing overlay elements.
- Design main control panel interface (layout, navigation).
- CRUD for overlays: create, edit, delete, and list elements (lower thirds, supers, titles).
- Local configuration storage in SQLite using better-sqlite3.
- Preview system: see how the overlay will look before emitting it.

### Phase 2 — Overlay System and URL Output
**Goal**: Render overlays in real-time accessible via browser URL.
- Create output route (e.g., `localhost:3000/overlay`) that renders active elements.
- Implement WebSockets with Socket.io so the control panel updates overlays in real-time.
- Design overlay components: lower thirds, supers, titles with base styles.
- Integrate Framer Motion for entry/exit overlay animations.
- Implement functional timers/chronometers with panel control.
### Phase 2.5 — PTZ Camera Control
**Goal**: Control PTZ cameras directly from the control panel.
- Implement protocol handlers: VISCA (Sony), Pelco-D/P, ONVIF, HTTP/REST APIs, UVC PTZ.
- Design camera control panel: presets, pan/tilt/zoom controls, focus.
- Support multiple cameras with profiles (IP, port, protocol, credentials).
- Save camera presets in SQLite for quick recall.
- Virtual joystick or keyboard shortcuts for camera control.
- Auto-discovery for ONVIF cameras on local network.
### Phase 3 — Graphics Generation with Templates
**Goal**: User selects a template, inputs data, and the graphic is auto-generated.
- Design pre-established template system (bars, scores, statistics, etc.).
- Integrate Chart.js or Recharts for dynamic graphic rendering.
- Create panel forms for data input per template.
- Generated graphics must be displayable as overlay via the output URL.
- Save custom templates in SQLite using better-sqlite3 for reuse.

### Phase 4 — Facebook Integration
**Goal**: Connect with Facebook to collect and display live transmission comments.
- Implement OAuth 2.0 flow for login with page admin account.
- Connect with Facebook Graph API using native fetch to get real-time comments.
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
- Advanced PTZ features: auto-tracking, multi-camera switching, camera macros.
- NDI camera support with tally lights.

---

**This comprehensive document serves as the primary reference for all development activities in StreamCtrl.app. All code generation, architectural decisions, and implementation details must align with these guidelines and specifications.**