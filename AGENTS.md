<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Default production builds to Nitro's `cloudflare-pages` preset with a flat `dist/_worker.js` entry file (not a directory) so Lovable can serve the SSR app; use `vercel` when `VERCEL=1` and honor explicit `NITRO_PRESET` overrides to preserve other hosting targets.
- Wrap browser-only contact export library imports in `createClientOnlyFn` so PDF and spreadsheet downloads stay out of the Worker SSR import graph.
