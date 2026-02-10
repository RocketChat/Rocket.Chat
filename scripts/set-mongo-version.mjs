#!/usr/bin/env node
/**
 * Updates the MongoDB version used by CI/test compose files and workflows.
 *
 * Usage:
 *   node ./scripts/set-mongo-version.mjs <mongodbVersion> [--federation <federationMongoVersion>] [--dry-run]
 *
 * Examples:
 *   node ./scripts/set-mongo-version.mjs 8.2
 *   node ./scripts/set-mongo-version.mjs 8.2 --federation 8.0
 *   node ./scripts/set-mongo-version.mjs 7.0 --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function die(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function isVersionLike(v) {
  return typeof v === 'string' && /^\d+(?:\.\d+)?$/.test(v);
}

function deriveFederationVersion(mongodbVersion) {
  const m = /^(\d+)\.(\d+)$/.exec(mongodbVersion);
  if (!m) {
    return mongodbVersion;
  }
  const major = m[1];
  const minor = Number(m[2]);
  if (Number.isNaN(minor) || minor === 0) {
    return mongodbVersion;
  }
  return `${major}.0`;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const out = { mongodbVersion: '', federationVersion: '', compatibleVersions: [], dryRun: false };

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    die(
      [
        'Usage: node ./scripts/set-mongo-version.mjs <mongodbVersion> [--federation <federationMongoVersion>] [--compatible <v1,v2,...>] [--dry-run]',
        '',
        'Examples:',
        '  node ./scripts/set-mongo-version.mjs 8.2',
        '  node ./scripts/set-mongo-version.mjs 8.2 --federation 8.0',
        '  node ./scripts/set-mongo-version.mjs 7.0 --dry-run',
      ].join('\n'),
    );
  }

  out.mongodbVersion = args[0];
  if (!isVersionLike(out.mongodbVersion)) {
    die(`Invalid mongodbVersion: "${out.mongodbVersion}" (expected something like "8.2" or "7.0")`);
  }

  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') {
      out.dryRun = true;
      continue;
    }
    if (a === '--federation') {
      const v = args[i + 1];
      if (!v || v.startsWith('--')) {
        die('Missing value for --federation');
      }
      if (!isVersionLike(v)) {
        die(`Invalid --federation version: "${v}" (expected something like "8.0" or "7.0")`);
      }
      out.federationVersion = v;
      i++;
      continue;
    }
    if (a === '--compatible') {
      const v = args[i + 1];
      if (!v || v.startsWith('--')) {
        die('Missing value for --compatible (expected comma-separated list like "7.0,8.2")');
      }
      const parts = v
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      if (parts.length === 0) {
        die('Invalid --compatible value (empty list)');
      }
      for (const p of parts) {
        if (!isVersionLike(p)) {
          die(`Invalid --compatible entry: "${p}" (expected something like "8.2" or "7.0")`);
        }
      }
      out.compatibleVersions = parts;
      i++;
      continue;
    }
    die(`Unknown argument: ${a}`);
  }

  if (!out.federationVersion) {
    out.federationVersion = deriveFederationVersion(out.mongodbVersion);
  }
  if (out.compatibleVersions.length === 0) {
    out.compatibleVersions = [out.mongodbVersion];
  }

  return out;
}

function replaceAllOrThrow({ filePath, content, replacements }) {
  let next = content;
  const changes = [];

  for (const r of replacements) {
    const before = next;
    if (r.pattern.global || r.pattern.sticky) {
      r.pattern.lastIndex = 0;
    }
    const hadMatch = before.match(r.pattern) !== null;
    if (r.pattern.global || r.pattern.sticky) {
      r.pattern.lastIndex = 0;
    }
    next = before.replace(r.pattern, r.replace);
    if (before !== next) {
      changes.push(r.description);
    } else if (!hadMatch && r.required) {
      throw new Error(`Expected pattern not found (${r.description}) in ${filePath}`);
    }
  }

  return { next, changes };
}

function updateFile(fileRelPath, replacements, { dryRun }) {
  const filePath = path.join(repoRoot, fileRelPath);
  const content = fs.readFileSync(filePath, 'utf8');
  const { next, changes } = replaceAllOrThrow({ filePath, content, replacements });

  if (next === content) {
    process.stdout.write(`- ${fileRelPath}: no changes\n`);
    return false;
  }

  process.stdout.write(`- ${fileRelPath}: updated (${changes.join(', ') || 'content'})\n`);

  if (!dryRun) {
    fs.writeFileSync(filePath, next);
  }

  return true;
}

const { mongodbVersion, federationVersion, compatibleVersions, dryRun } = parseArgs(process.argv);

process.stdout.write(`MongoDB (CI/local) version: ${mongodbVersion}\n`);
process.stdout.write(`MongoDB (federation tests) version: ${federationVersion}\n`);
process.stdout.write(`MongoDB (artifact compatible versions): ${compatibleVersions.join(', ')}\n`);
if (dryRun) {
  process.stdout.write('(dry-run)\n');
}

let any = false;

any =
  updateFile(
    'docker-compose-ci.yml',
    [
      {
        description: 'MONGODB_VERSION default',
        required: true,
        pattern: /\$\{MONGODB_VERSION:-([0-9.]+)\}/g,
        replace: `\${MONGODB_VERSION:-${mongodbVersion}}`,
      },
    ],
    { dryRun },
  ) || any;

any =
  updateFile(
    'docker-compose-local.yml',
    [
      {
        description: 'mongodb-community-server image (supports hardcoded or env default)',
        required: true,
        pattern:
          /image:\s*mongodb\/mongodb-community-server:(?:\$\{MONGODB_VERSION:-)?(\d+(?:\.\d+)?)(?:\})?-ubi8/g,
        replace: `image: mongodb/mongodb-community-server:\${MONGODB_VERSION:-${mongodbVersion}}-ubi8`,
      },
    ],
    { dryRun },
  ) || any;

any =
  updateFile(
    '.github/workflows/ci-test-e2e.yml',
    [
      {
        description: 'workflow_call.mongodb-version default',
        required: true,
        pattern: /(mongodb-version:\s*\n\s*default:\s*)"\['(\d+(?:\.\d+)?)'\]"/g,
        replace: `$1"['${mongodbVersion}']"`,
      },
    ],
    { dryRun },
  ) || any;

any =
  updateFile(
    '.github/workflows/ci.yml',
    [
      {
        description: 'mongodb-version matrix pin',
        required: true,
        pattern: /(mongodb-version:\s*)"\['(\d+(?:\.\d+)?)'\]"/g,
        replace: `$1"['${mongodbVersion}']"`,
      },
      {
        description: 'coverage pin',
        required: true,
        pattern: /(coverage:\s*)'(\d+(?:\.\d+)?)'/g,
        replace: `$1'${mongodbVersion}'`,
      },
      {
        description: 'compatibleMongoVersions in artifact metadata JSON',
        required: true,
        pattern: /compatibleMongoVersions\\":\s*\[[^\]]*\]/g,
        replace: `compatibleMongoVersions\\": [${compatibleVersions.map((v) => `\\\"${v}\\\"`).join(', ')}]`,
      },
    ],
    { dryRun },
  ) || any;

any =
  updateFile(
    'ee/packages/federation-matrix/docker-compose.test.yml',
    [
      {
        description: 'federation mongo image (supports hardcoded or env default)',
        required: true,
        pattern:
          /image:\s*mongo:(?:\$\{MONGODB_FEDERATION_VERSION:-)?(\d+(?:\.\d+)?)(?:\})?/g,
        replace: `image: mongo:\${MONGODB_FEDERATION_VERSION:-${federationVersion}}`,
      },
    ],
    { dryRun },
  ) || any;

if (!any) {
  process.stdout.write('No changes were necessary.\n');
}

