/**
 * Standard TanStack Start build (no Lovable tooling).
 *
 *  - `npm run dev`    → local dev server on http://localhost:8080
 *  - `npm run build`  → production build for Lovable in dist/
 *    Vercel builds automatically use its preset; NITRO_PRESET can override the target.
 *    Other hosts: NITRO_PRESET=node-server npm run build  (then `node .output/server/index.mjs`)
 */
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, mode }) => {
  // Expose VITE_* values (Supabase URL + publishable key) to both browser and server code.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    define,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": resolve(process.cwd(), "src") },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    server: { host: "::", port: 8080 },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        // src/server.ts wraps SSR with a friendly error page.
        server: { entry: "server" },
        // Keep server-only code out of the browser bundle.
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
      }),
      ...(command === "build"
        ? [
            nitro({
              preset:
                process.env["NITRO_PRESET"] ||
                (process.env["VERCEL"] === "1" ? "vercel" : "cloudflare-pages"),
            }),
          ]
        : []),
      viteReact(),
    ],
  };
});
