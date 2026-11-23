import { resolveConfig } from "vite";
import assert from "node:assert/strict";

// Resolve the real build configuration without running a build. In particular,
// Nitro + Vite 8 must disable code splitting for the hosted single-file loader.
const originalPreset = process.env["NITRO_PRESET"];
const originalVercel = process.env["VERCEL"];
try {
  for (const target of ["default", "vercel", "node-server"]) {
    delete process.env["NITRO_PRESET"];
    delete process.env["VERCEL"];
    if (target === "vercel") process.env["VERCEL"] = "1";
    if (target === "node-server") process.env["NITRO_PRESET"] = target;

    const config = await resolveConfig({ configFile: "vite.config.ts" }, "build");
    const environment = config.environments["nitro"];
    assert.ok(environment, "Nitro server environment must exist");
    const output = environment.build.rolldownOptions?.output ??
      environment.build.rollupOptions?.output;
    assert.ok(output && !Array.isArray(output), "Expected one server output configuration");
    if (target === "default") {
      assert.equal(output.entryFileNames, "_worker.js");
      assert.ok(
        output.codeSplitting === false || output.inlineDynamicImports === true,
        "Hosted server entry must not reference sibling chunks",
      );
    } else {
      assert.notEqual(output.entryFileNames, "_worker.js");
    }
    console.log(`PASS: ${target} publishing configuration`);
  }
} finally {
  if (originalPreset === undefined) delete process.env["NITRO_PRESET"];
  else process.env["NITRO_PRESET"] = originalPreset;
  if (originalVercel === undefined) delete process.env["VERCEL"];
  else process.env["VERCEL"] = originalVercel;
}