#!/usr/bin/env node
/**
 * Lists API endpoints that still use addRoute (legacy pattern) and need to be
 * migrated to the new .get/.post/.put/.delete pattern with rest-typings.
 *
 * Usage: node scripts/list-unmigrated-api-endpoints.mjs
 *        node scripts/list-unmigrated-api-endpoints.mjs --json
 */

import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const apiDir = join(root, 'apps/meteor/app/api');

const results = [];

function extractPaths(firstArg) {
  const trimmed = firstArg.trim();
  if (trimmed.startsWith('[')) {
    const matches = trimmed.matchAll(/['"]([^'"]+)['"]/g);
    return [...matches].map((m) => m[1]);
  }
  const m = trimmed.match(/^['"]([^'"]+)['"]/);
  return m ? [m[1]] : [];
}

function scan(filePath, content) {
  const re = /API\.(v1|default)\.addRoute\s*\(\s*(\[[^\]]*\]|['"][^'"]+['"])/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const api = match[1];
    const paths = extractPaths(match[2]);
    const line = (content.slice(0, match.index).split('\n').length);
    for (const path of paths) {
      results.push({
        file: relative(root, filePath),
        api: api === 'v1' ? 'v1' : 'default',
        path,
        line,
      });
    }
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walk(full);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      scan(full, readFileSync(full, 'utf8'));
    }
  }
}

walk(apiDir);

const byFile = {};
for (const r of results) {
  byFile[r.file] = (byFile[r.file] || 0) + 1;
}

const sortedFiles = Object.entries(byFile).sort((a, b) => b[1] - a[1]);

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      {
        total: results.length,
        byFile: sortedFiles.map(([file, count]) => ({ file, count })),
        endpoints: results,
      },
      null,
      2,
    ),
  );
} else {
  console.log(`Total: ${results.length} addRoute registrations (endpoints to migrate)\n`);
  console.log('By file:');
  console.log('-'.repeat(60));
  for (const [file, count] of sortedFiles) {
    console.log(`  ${String(count).padStart(3)}  ${file}`);
  }
  console.log('-'.repeat(60));
  console.log(`  ${String(results.length).padStart(3)}  TOTAL`);
}
