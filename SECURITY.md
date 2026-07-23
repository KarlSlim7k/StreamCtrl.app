# Security Policy

## Supported versions

StreamCtrl.app has not released a production version. Security fixes currently
target the default branch.

## Reporting a vulnerability

Do not publish credentials, tokens, private production data or an exploitable
report in a public issue. Contact the repository owner privately through their
GitHub profile and include:

- affected commit or version;
- reproduction conditions;
- expected impact;
- suggested mitigation, if known.

## Project security boundaries

- Core operation is local and bound to loopback by default.
- Electron renderers do not receive unrestricted Node.js access.
- IPC and realtime payloads require runtime validation.
- Secrets and runtime databases are excluded from version control.
- vMix automation is optional and cannot become the authority for match state.

These are design commitments, not a guarantee that unreleased software is safe
for production.
