#!/usr/bin/env node

/**
 * Disposable verification script: checks that no imports still reference
 * old paths that should have been updated during migration.
 *
 * Usage:
 *   node verify-no-old-imports.mjs <old-path-pattern>...
 *
 * Example:
 *   node verify-no-old-imports.mjs "app/slashcommand" "app/bot-helpers/server"
 *
 * Scans all .ts/.js files under apps/meteor/ for import statements
 * containing the given patterns and reports any matches.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const patterns = process.argv.slice(2);

if (patterns.length === 0) {
	console.error('Usage: node verify-no-old-imports.mjs <old-path-pattern>...');
	console.error('Example: node verify-no-old-imports.mjs "app/slashcommand" "app/bot-helpers/server"');
	process.exit(1);
}

function getAllFiles(dir, exts = ['.ts', '.js', '.tsx', '.jsx']) {
	const results = [];
	if (!fs.existsSync(dir)) return results;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.meteor') {
			results.push(...getAllFiles(full, exts));
		} else if (exts.some((ext) => entry.name.endsWith(ext))) {
			results.push(full);
		}
	}
	return results;
}

// Matches static imports/re-exports, bare imports, dynamic import(), and require().
const IMPORT_RE = /(?:from\s+|import\s+|(?:import|require)\s*\(\s*)(['"])([^'"]+)\1/g;

const searchDirs = [path.join(ROOT, 'app'), path.join(ROOT, 'server'), path.join(ROOT, 'ee'), path.join(ROOT, 'lib')];

let violations = 0;

for (const dir of searchDirs) {
	const files = getAllFiles(dir);
	for (const file of files) {
		const content = fs.readFileSync(file, 'utf8');
		const lines = content.split('\n');
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			let m;
			const re = new RegExp(IMPORT_RE.source, 'g');
			while ((m = re.exec(line)) !== null) {
				const specifier = m[2];
				for (const pattern of patterns) {
					if (specifier.includes(pattern)) {
						const relPath = path.relative(ROOT, file);
						console.log(`  ${relPath}:${i + 1} → ${specifier}`);
						violations++;
					}
				}
			}
		}
	}
}

if (violations === 0) {
	console.log(`No imports found matching patterns: ${patterns.join(', ')}`);
} else {
	console.error(`\nFound ${violations} import(s) still referencing old paths.`);
	process.exit(1);
}
