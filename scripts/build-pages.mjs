import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(root, "src", "app", "api");
const disabledApiDir = join(root, "src", "app", "_api-static-build-disabled");
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserOrOrgPages = repositoryName?.endsWith(".github.io") ?? false;
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.GITHUB_ACTIONS === "true" && repositoryName && !isUserOrOrgPages
    ? `/${repositoryName}`
    : "");
const demoPasswordHash =
  process.env.NEXT_PUBLIC_DEMO_PASSWORD_SHA256?.trim().toLowerCase() ??
  (process.env.DEMO_PASSWORD
    ? createHash("sha256").update(process.env.DEMO_PASSWORD).digest("hex")
    : undefined);

let moved = false;

try {
  if (!demoPasswordHash) {
    throw new Error("DEMO_PASSWORD or NEXT_PUBLIC_DEMO_PASSWORD_SHA256 is required for GitHub Pages demo builds.");
  }

  if (existsSync(disabledApiDir)) {
    rmSync(disabledApiDir, { recursive: true, force: true });
  }
  if (existsSync(apiDir)) {
    renameSync(apiDir, disabledApiDir);
    moved = true;
  }

  const result = spawnSync(process.execPath, [nextBin, "build"], {
    cwd: root,
    env: {
      ...process.env,
      NEXT_PUBLIC_STATIC_DEMO: "true",
      NEXT_PUBLIC_BASE_PATH: basePath,
      NEXT_PUBLIC_DEMO_PASSWORD_SHA256: demoPasswordHash,
    },
    stdio: "inherit",
  });

  process.exitCode = result.status ?? 1;
} finally {
  if (moved && existsSync(disabledApiDir)) {
    renameSync(disabledApiDir, apiDir);
  }
}
