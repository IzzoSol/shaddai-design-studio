# SHADDAI design studio (private)

One private home for design systems, creative workflows and the tools that audit them. Everything here is usable by SHADDAI; reference code from third-party UI libraries is **not** copied in (see `sh-ui/README.md` for sources).

```
sh-ui/          vanilla design system for the dashboard (buttons, tabs, fields, cards, empty states, tables, dialogs)
tools/          dash-visual-lint.js — walks every dashboard view and reports visual problems as JSON
workflows/      scenario playbooks as data (workflows.json): UGC ads, game pitch + trailer, long video to shorts
```

## Workflows
`workflows/workflows.json` is the single source of truth. Each workflow lists inputs, agent + tool steps, a quality gate, a compliance checklist and expected outputs. The same file can be:
- rendered as a guide or checklist (QUILL),
- exposed as an MCP tool (`run_workflow(id, inputs)`) next to the existing SHADDAI MCP tools,
- packaged and sold as a pack once reviewed.

Existing pieces these chain together: dashboard Media Studio (image / video / voice / writer), Shaddai-Clipper-Feature- (local Whisper + ffmpeg), turtle-music-bot and FL-STUDIO-AI (music + MCP), shaddai-gamedev-tools (game dev), ai-influencer (fictional cast; rules: no real likeness, non-explicit, AI-disclosed).

## Rules baked into every workflow
- AI-generated people and voices are disclosed where required.
- No invented testimonials, reviews, results or player counts.
- No real person's likeness or voice without written permission.
- Only clip and publish content you own or have rights to.

## Status
v0.1: design system + lint + three workflows. Next: wire `run_workflow` into the SHADDAI MCP server, add scenario packs (launch kit, creator media kit, game update post), version each pack.
