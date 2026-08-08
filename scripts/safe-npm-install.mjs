#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const installArgs = process.argv.slice(2);
const trackedFiles = ["package.json", "package-lock.json"];
const snapshots = new Map(
  trackedFiles.map((file) => [file, readFileSync(file)]),
);

if (installArgs.length === 0) {
  console.error("Usage: npm run deps:add -- <package> [npm install options]");
  process.exit(2);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with status ${result.status}`);
  }
}

function restoreManifests() {
  for (const [file, contents] of snapshots) {
    writeFileSync(file, contents);
  }
}

try {
  run("npm", ["install", "--ignore-scripts", ...installArgs]);
  run("npm", ["run", "security:dependencies"]);
  run("npm", ["rebuild"]);
  console.log("Dependency installed after OSV, GuardDog, and signature checks passed.");
} catch (error) {
  console.error(`Safe dependency install failed: ${error.message}`);
  console.error("Restoring package.json, package-lock.json, and the previous dependency tree...");
  restoreManifests();

  const restore = spawnSync("npm", ["ci", "--ignore-scripts"], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });

  if (restore.error || restore.status !== 0) {
    console.error("Automatic node_modules restoration failed; run npm ci --ignore-scripts manually.");
  }

  process.exit(1);
}
