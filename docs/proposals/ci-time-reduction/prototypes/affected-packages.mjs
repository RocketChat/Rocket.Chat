#!/usr/bin/env node
// Prototype: "which workspaces are affected by these changed files, incl. dependents?"
//
// This is the STATIC graph query referenced in strategy.md §10.1 / Layer 2.
// It needs NO git history and NO turbo install — only the workspace package.json
// files that are always present in a depth-1 checkout. It answers the same
// question `turbo run <task> --filter=...<pkg>` answers, from the dependency
// graph alone.
//
// Usage:
//   node affected-packages.mjs <file1> <file2> ...
//   gh pr diff --name-only <pr> | node affected-packages.mjs -
//
// Output (JSON): { changedFiles, owners, affected, unmappedFiles, wouldForceFull }

import { readFileSync, existsSync } from 'node:fs';
import { globSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.argv.includes('--root')
  ? process.argv[process.argv.indexOf('--root') + 1]
  : process.cwd();

// Workspace globs from the root package.json.
const rootPkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const workspaceGlobs = rootPkg.workspaces ?? [];

// Resolve every workspace: { name -> dir } and a dir list for prefix matching.
const dirToName = new Map();
for (const g of workspaceGlobs) {
  for (const dir of globSync(g, { cwd: ROOT })) {
    const pj = path.join(ROOT, dir, 'package.json');
    if (!existsSync(pj)) continue;
    const name = JSON.parse(readFileSync(pj, 'utf8')).name;
    if (name) dirToName.set(dir.replaceAll('\\', '/'), name);
  }
}
const nameToDir = new Map([...dirToName].map(([d, n]) => [n, d]));

// Build internal dependency edges (only @rocket.chat/* workspace deps count).
// dependents: name -> Set(names that depend on it)  [reverse edges]
const dependents = new Map([...dirToName.values()].map((n) => [n, new Set()]));
for (const [dir, name] of dirToName) {
  const pj = JSON.parse(readFileSync(path.join(ROOT, dir, 'package.json'), 'utf8'));
  const deps = {
    ...pj.dependencies,
    ...pj.devDependencies,
    ...pj.peerDependencies,
    ...pj.optionalDependencies,
  };
  for (const dep of Object.keys(deps)) {
    if (nameToDir.has(dep)) dependents.get(dep).add(name); // dep is depended-on by name
  }
}

// Map a changed file to its owning workspace via LONGEST matching dir prefix
// (handles nested workspaces like apps/meteor vs apps/meteor/ee/server/services).
const dirsByLenDesc = [...dirToName.keys()].sort((a, b) => b.length - a.length);
function ownerOf(file) {
  const f = file.replaceAll('\\', '/');
  for (const dir of dirsByLenDesc) {
    if (f === dir || f.startsWith(dir + '/')) return dirToName.get(dir);
  }
  return null; // not inside any workspace (root files, apps/meteor app code, .github, docs…)
}

function readChangedFiles() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--') && a !== path.basename(process.argv[1]));
  const positional = args.filter((a) => a !== '-');
  if (process.argv.includes('-') || positional.length === 0) {
    const stdin = readFileSync(0, 'utf8');
    return stdin.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return positional;
}

const changedFiles = readChangedFiles();
const owners = new Set();
const unmappedFiles = [];
for (const f of changedFiles) {
  const o = ownerOf(f);
  if (o) owners.add(o);
  else unmappedFiles.push(f);
}

// BFS over reverse edges: owners + everything that (transitively) depends on them.
const affected = new Set(owners);
const queue = [...owners];
while (queue.length) {
  const cur = queue.shift();
  for (const d of dependents.get(cur) ?? []) {
    if (!affected.has(d)) {
      affected.add(d);
      queue.push(d);
    }
  }
}

// Files outside every workspace (docs/**, .github/**, root config, and all of
// apps/meteor's non-workspace app code) are NOT decided here — they are handed
// to the PATH classifier, which sorts them into ignore / core-tripwire / meteor.
// So "unmapped" means "defer to path rules", NOT "force full".

console.log(
  JSON.stringify(
    {
      changedFiles: changedFiles.length,
      owners: [...owners].sort(),
      affected: [...affected].sort(),
      affectedCount: affected.size,
      totalWorkspaces: dirToName.size,
      unmappedFilesDeferredToPathRules: unmappedFiles,
    },
    null,
    2,
  ),
);
