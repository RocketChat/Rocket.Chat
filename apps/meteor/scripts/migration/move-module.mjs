#!/usr/bin/env node

/**
 * Disposable migration script: moves a module directory and updates all imports.
 *
 * Usage:
 *   node move-module.mjs --from app/slashcommands-ban/server --to server/slashcommands/ban
 *
 * All paths are relative to the Meteor app root (apps/meteor/).
 *
 * What it does:
 *   1. git mv every file from <from> to <to>
 *   2. Update relative imports WITHIN moved files (their position in the tree changed)
 *   3. Update relative imports in OTHER files that referenced the moved module
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
const toIdx = args.indexOf('--to');

if (fromIdx === -1 || toIdx === -1 || !args[fromIdx + 1] || !args[toIdx + 1]) {
	console.error('Usage: node move-module.mjs --from <old-dir> --to <new-dir>');
	console.error('Paths are relative to apps/meteor/');
	process.exit(1);
}

const ROOT = path.resolve(import.meta.dirname, '../..');
const fromRel = args[fromIdx + 1];
const toRel = args[toIdx + 1];
const fromAbs = path.resolve(ROOT, fromRel);
const toAbs = path.resolve(ROOT, toRel);

const dryRun = args.includes('--dry-run');

// ── License-boundary guard (mandatory) ─────────────────────────────────────────
// EE code is protected by the Enterprise license *only* because it lives under an
// `ee/` path. A move that crosses the boundary in either direction would silently
// relicense the file, so we refuse it loudly before touching anything.
// Normalize (resolve + relativize against ROOT) before checking, so `..` segments
// can't sneak a boundary-crossing path past a raw string match (e.g. `ee/../server`
// contains the literal `ee` segment but actually resolves into the community tree).
const hasEESegment = (p) => path.relative(ROOT, path.resolve(ROOT, p)).split(path.sep).includes('ee');
if (hasEESegment(fromRel) !== hasEESegment(toRel)) {
	console.error('License-boundary violation: a move must keep `ee/` sources under `ee/` and community sources outside `ee/`.');
	console.error(`  from: ${fromRel} (ee: ${hasEESegment(fromRel)})`);
	console.error(`  to:   ${toRel} (ee: ${hasEESegment(toRel)})`);
	process.exit(1);
}

if (!fs.existsSync(fromAbs)) {
	console.error(`Source does not exist: ${fromAbs}`);
	process.exit(1);
}

// A move can target either a directory (move all files within it) or a single
// file. For a single file, `--to` may be the full destination file path or a
// destination directory.
const isFileMove = fs.statSync(fromAbs).isFile();

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAllFiles(dir, exts = ['.ts', '.js', '.tsx', '.jsx']) {
	const results = [];
	if (!fs.existsSync(dir)) return results;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...getAllFiles(full, exts));
		} else if (exts.some((ext) => entry.name.endsWith(ext))) {
			results.push(full);
		}
	}
	return results;
}

/**
 * Given a file at `fromFile` that has `import ... from '<specifier>'`,
 * resolve that specifier to an absolute filesystem path.
 * Returns null if it's not a relative import or can't be resolved.
 */
function resolveImportSpecifier(fromFile, specifier) {
	if (!specifier.startsWith('.')) return null; // skip package imports
	const dir = path.dirname(fromFile);
	const resolved = path.resolve(dir, specifier);
	// Try to find the actual file (could be .ts, /index.ts, etc.)
	for (const candidate of [
		`${resolved}.ts`,
		`${resolved}.tsx`,
		`${resolved}.js`,
		`${resolved}.jsx`,
		path.join(resolved, 'index.ts'),
		path.join(resolved, 'index.js'),
		resolved, // exact match (rare)
	]) {
		if (fs.existsSync(candidate)) return candidate;
	}
	// Return the resolved path even if we can't find the file
	// (it might have been moved already)
	return resolved;
}

/**
 * Compute a relative import specifier from `fromFile` to `targetAbs`.
 * Strips extensions and /index suffix to match TypeScript conventions.
 */
function computeRelativeSpecifier(fromFile, targetAbs) {
	const fromDir = path.dirname(fromFile);
	let rel = path.relative(fromDir, targetAbs);
	// Remove file extensions
	rel = rel.replace(/\.(ts|tsx|js|jsx)$/, '');
	// Remove /index suffix
	rel = rel.replace(/\/index$/, '');
	// Ensure it starts with ./ or ../
	if (!rel.startsWith('.')) {
		rel = `./${rel}`;
	}
	return rel;
}

// Regex to match import specifiers. Covers static `import x from 'y'`,
// re-exports `export { x } from 'y'`, bare `import 'y'`, dynamic `import('y')`,
// and CommonJS `require('y')`.
const IMPORT_RE = /(?:from\s+|import\s+|(?:import|require)\s*\(\s*)(['"])([^'"]+)\1/g;

/**
 * Update all relative imports in a file based on its old and new positions.
 * `movedFiles` is a Map<oldAbsPath, newAbsPath> of all files being moved
 * in the same operation, so we can resolve imports to co-moved siblings.
 */
function updateImportsInFile(filePath, oldFilePath, movedFiles = new Map()) {
	let content = fs.readFileSync(filePath, 'utf8');
	let changed = false;

	content = content.replace(IMPORT_RE, (match, quote, specifier) => {
		if (!specifier.startsWith('.')) return match; // skip package imports

		// Resolve the specifier relative to the OLD file location
		let absoluteTarget = resolveImportSpecifier(oldFilePath, specifier);
		if (!absoluteTarget) return match;

		// If the target also moved (sibling file in same module), use its new location
		for (const [oldPath, newPath] of movedFiles) {
			const oldNoExt = oldPath.replace(/\.(ts|tsx|js|jsx)$/, '');
			// Check exact match or match stripping extension
			if (absoluteTarget === oldPath || absoluteTarget === oldNoExt) {
				absoluteTarget = newPath;
				break;
			}
			// Only treat as "inside a moved index dir" with a proper separator boundary
			if (absoluteTarget.startsWith(oldNoExt + path.sep)) {
				absoluteTarget = newPath + absoluteTarget.slice(oldPath.length);
				break;
			}
		}

		// Compute new relative specifier from the NEW file location
		const newSpecifier = computeRelativeSpecifier(filePath, absoluteTarget);

		if (newSpecifier !== specifier) {
			changed = true;
			return match.replace(specifier, newSpecifier);
		}
		return match;
	});

	if (changed) {
		fs.writeFileSync(filePath, content, 'utf8');
	}
	return changed;
}

/**
 * Check if a file imports from any path within the given directory.
 * Returns the matched import specifiers.
 */
function findImportsFrom(filePath, targetDirAbs) {
	const content = fs.readFileSync(filePath, 'utf8');
	const matches = [];
	let m;
	const re = new RegExp(IMPORT_RE.source, 'g');
	while ((m = re.exec(content)) !== null) {
		const specifier = m[2];
		if (!specifier.startsWith('.')) continue;
		const resolved = resolveImportSpecifier(filePath, specifier);
		if (resolved && (resolved === targetDirAbs || resolved.startsWith(targetDirAbs + path.sep))) {
			matches.push({ specifier, resolved });
		}
	}
	return matches;
}

/**
 * Update imports in external files that reference the moved module.
 * `oldRef`/`newRef` are the old and new absolute paths — a directory for a dir
 * move, or a file path for a single-file move.
 *
 * This runs AFTER `git mv`, so the source no longer exists on disk and
 * `resolveImportSpecifier` returns an extensionless fallback path. We therefore
 * compare with extensions stripped rather than relying on the exact resolved path.
 */
function updateExternalImports(externalFile, oldRef, newRef) {
	const stripExt = (p) => p.replace(/\.(ts|tsx|js|jsx)$/, '');
	const oldRefNoExt = stripExt(oldRef);
	// When the moved file is a directory's `index`, importers may reference the
	// directory itself (e.g. `import '../api/server'`). Post-`git mv` the index
	// is gone, so resolution falls back to the bare directory path — match that too.
	// Use path.basename so this is separator-safe (a directory-index move on
	// Windows resolves oldRef with `\` separators, which a hardcoded `/` misses).
	const oldIsIndex = /^index\.(ts|tsx|js|jsx)$/.test(path.basename(oldRef));
	const oldRefDir = path.dirname(oldRef);

	let content = fs.readFileSync(externalFile, 'utf8');
	let changed = false;

	content = content.replace(IMPORT_RE, (match, quote, specifier) => {
		if (!specifier.startsWith('.')) return match;

		const resolved = resolveImportSpecifier(externalFile, specifier);
		if (!resolved) return match;

		let newAbsolute;
		if (stripExt(resolved) === oldRefNoExt || (oldIsIndex && resolved === oldRefDir)) {
			// Exact match: the moved file/dir-root itself, or the directory whose
			// index file was moved.
			newAbsolute = newRef;
		} else if (resolved.startsWith(oldRef + path.sep)) {
			// A file inside the moved directory — preserve its relative offset.
			newAbsolute = path.join(newRef, path.relative(oldRef, resolved));
		} else {
			return match;
		}

		const newSpecifier = computeRelativeSpecifier(externalFile, newAbsolute);
		if (newSpecifier !== specifier) {
			changed = true;
			return match.replace(specifier, newSpecifier);
		}
		return match;
	});

	if (changed) {
		fs.writeFileSync(externalFile, content, 'utf8');
	}
	return changed;
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log(`Moving: ${fromRel} → ${toRel}`);

// 1. Collect files to move and build the old→new path mapping.
// `oldRef`/`newRef` are the absolute path prefixes used to match external
// imports — the directory itself for a dir move, or the file path for a single
// file (in which case only an exact match counts).
const pathMap = new Map(); // oldAbsPath → newAbsPath
const oldRef = fromAbs;
let newRef = toAbs;

if (isFileMove) {
	// `--to` is a file path if it carries a known extension, otherwise a dir.
	const toLooksLikeFile = /\.(ts|tsx|js|jsx)$/.test(toRel);
	const newFile = toLooksLikeFile ? toAbs : path.join(toAbs, path.basename(fromAbs));
	pathMap.set(fromAbs, newFile);
	newRef = newFile;
	console.log('  Single-file move');
} else {
	const filesToMove = getAllFiles(fromAbs);
	if (filesToMove.length === 0) {
		console.error('No .ts/.js files found in source directory');
		process.exit(1);
	}
	console.log(`  Found ${filesToMove.length} files to move`);
	for (const oldFile of filesToMove) {
		const relToFrom = path.relative(fromAbs, oldFile);
		const newFile = path.join(toAbs, relToFrom);
		pathMap.set(oldFile, newFile);
	}
}

// 3. Find external files that import from the old location
console.log('  Scanning for external files that import from the moved module...');
// `tests` is included so unit/e2e tests that import the moved module (or mirror
// its path) get their specifiers rewritten too — otherwise `tsc` later fails.
// `imports` (personal-access-tokens et al.) also imports server code — missing it
// left stale specifiers that only `tsc` caught (found during Phase 4).
const searchDirs = ['app', 'server', 'ee', 'lib', 'tests', 'imports', 'client', 'definition', 'packages'].map((d) => path.join(ROOT, d));
const externalFiles = [];
for (const dir of searchDirs) {
	if (fs.existsSync(dir)) {
		externalFiles.push(...getAllFiles(dir));
	}
}

const affectedExternalFiles = [];
for (const ext of externalFiles) {
	if (pathMap.has(ext)) continue; // skip files being moved
	const imports = findImportsFrom(ext, oldRef);
	if (imports.length > 0) {
		affectedExternalFiles.push(ext);
	}
}
if (affectedExternalFiles.length > 0) {
	console.log(`  Found ${affectedExternalFiles.length} external files with imports to update`);
}

// 4. Move files with git mv
if (!dryRun) {
	// Create destination directories
	for (const [, newFile] of pathMap) {
		fs.mkdirSync(path.dirname(newFile), { recursive: true });
	}

	for (const [oldFile, newFile] of pathMap) {
		execFileSync('git', ['mv', oldFile, newFile], { cwd: ROOT, stdio: 'pipe' });
	}
	console.log(`  Moved ${pathMap.size} files`);
} else {
	console.log('  [DRY RUN] Would move:');
	for (const [oldFile, newFile] of pathMap) {
		console.log(`    ${path.relative(ROOT, oldFile)} → ${path.relative(ROOT, newFile)}`);
	}
}

// 5. Update imports WITHIN moved files
if (!dryRun) {
	let updatedCount = 0;
	for (const [oldFile, newFile] of pathMap) {
		if (updateImportsInFile(newFile, oldFile, pathMap)) {
			updatedCount++;
		}
	}
	console.log(`  Updated imports in ${updatedCount} moved files`);
}

// 6. Update imports in external files
if (!dryRun) {
	let updatedExternal = 0;
	for (const ext of affectedExternalFiles) {
		if (updateExternalImports(ext, oldRef, newRef)) {
			updatedExternal++;
		}
	}
	if (updatedExternal > 0) {
		console.log(`  Updated imports in ${updatedExternal} external files`);
	}
}

// 7. Clean up empty source directory (directory moves only)
if (!dryRun && !isFileMove) {
	// Remove the now-empty source directory (if it's truly empty after git mv)
	try {
		const remaining = fs.readdirSync(fromAbs);
		if (remaining.length === 0) {
			fs.rmdirSync(fromAbs);
			console.log(`  Removed empty directory: ${fromRel}`);
		}
	} catch {
		// Directory might already be gone
	}
}

console.log('Done.\n');
