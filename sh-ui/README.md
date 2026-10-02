# SH-UI

Small vanilla CSS design system for the SHADDAI dashboard. No framework, no build step. Sits on the dashboard's existing variables (`--accent`, `--border`, `--text-muted`, `--bg-card`) and falls back to the SHADDAI palette.

Components: `shui-btn` (solid, soft, ghost, danger; sm, lg), `shui-tabs` (pill rail), `shui-field`, `shui-label`, `shui-card`, `shui-toolbar`, `shui-badge`, `shui-empty`, `shui-table`, `shui-dialog`, `shui-toast`, `shui-skel`. Touch targets grow to 44px on coarse pointers; reduced motion respected.

## Where the patterns came from (not copied code)
Pill tabs, structured empty states and sticky blurred table headers follow the approach in Nuxt UI's dashboard theme (MIT). Sizing and focus-ring conventions follow shadcn/ui and Material UI guidance (MIT). Everything here is written fresh as plain CSS.
