# Quickstart Validation Guide

This guide defines the acceptance run for the first vertical slice. Commands are
finalized during implementation; placeholders below describe the required
developer scripts, not application code.

## Reference environment

- ASUS TUF Gaming A16 FA607NUG.
- Windows 11 Home Single Language x64, build 26200.
- AMD Ryzen 7 7445HS, 6 cores and 12 logical processors.
- 16 GB DDR5-5600.
- NVIDIA GeForce RTX 4050 Laptop GPU with 6 GB VRAM, driver 573.05.
- 512 GB and 1 TB NVMe SSDs.
- Active 1 Gbps Ethernet connection.
- 1920x1080 Program and Browser Input path at 30 fps.
- vMix Max 29.0.0.48 for final Browser Input validation.

This is the initial production baseline, not a published minimum requirement.
Record actual CPU, GPU, driver, RAM, OS build, vMix edition/version, resolution
and frame rate with every result.

## Automated validation

From the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Expected: every command exits successfully and produces no unhandled warning.

## Scenario A: match and clock

1. Start the desktop application in rehearsal mode.
2. Create Local vs Visitante using the default 45-minute format.
3. Start, pause, resume and correct the clock.
4. Set the score to 2–1 and then correct it to 1–1.
5. Set three minutes of added time and move to the second period.

Expected:

- Each accepted action increments the match revision once.
- Corrections remain visible in history.
- Duplicate actions do not apply twice.
- The displayed clock matches the official state.

## Scenario B: Preview and Program

1. Open Preview and Program in separate windows.
2. Edit the lower third without taking it.
3. Confirm Program remains unchanged.
4. Take the scorebug, then the lower third.
5. Execute `all.hide` during the lower-third entry.

Expected:

- Program changes only after explicit Take.
- Program contains no controls or diagnostics.
- `all.hide` reaches a clean frame in less than one second.

## Scenario C: recovery

1. With scorebug visible and clock running, close Program.
2. Reopen Program and measure time to restored state.
3. Disconnect the transport during a pending command and reconnect.
4. Restart the full application and restore the match.
5. Disable the vMix adapter and repeat score/clock operations.

Expected:

- Program restores in under three seconds.
- No command is applied twice.
- Full restoration takes under ten seconds.
- Adapter failure does not block browser output or official state.

## Scenario D: vMix Browser Input

1. Start StreamCtrl and note the Program URL:
   `http://127.0.0.1:3100/overlay/program`.
2. In vMix Max 29.0.0.48, add one Web Browser input at 1920x1080p30.
3. Disable Browser Input audio and keyboard input.
4. Confirm alpha transparency over moving video.
5. Run the match sequence and reconnect StreamCtrl without recreating the input.

Expected:

- Transparent areas reveal video correctly.
- Only the single Program input is required.
- Recovery restores the last confirmed frame.
- vMix automation may be disconnected without breaking the input.

## Two-hour endurance protocol

1. Start measurements at idle for five minutes.
2. Run the clock continuously for two hours.
3. Every five minutes, change score or take/hide a lower third.
4. At minutes 30, 60 and 90, force a Program reconnection.
5. At minute 75, disable vMix automation for five minutes.
6. Capture frame-time samples, clock drift, CPU, GPU and process memory.

Pass thresholds:

- Clock drift no greater than 100 ms against the chosen reference.
- 30 fps with no sustained drop longer than one second.
- No sustained memory pressure or paging that disrupts vMix or Program.
- No monotonically increasing memory trend after warm-up and cleanup.
- No duplicate command, corrupted snapshot or unrecoverable Program state.

Store results under `artifacts/performance/<date>-<machine>/`; generated
measurements are not committed unless explicitly selected as release evidence.

## Manual backup procedure

Before a final:

1. Export the match package and settings to removable storage.
2. Import them on a prepared backup computer.
3. Validate the Program URL locally on the backup.
4. Keep vMix configured with a disabled backup Browser Input.

Automatic failover is outside this feature; the documented manual switch is the
initial recovery path.
