#!/usr/bin/env node

/**
 * Disposable migration helper: finds relative imports that do not resolve to a
 * file on disk. Catches the directories ESLint ignores (its known blind spot
 * during this migration — see MIGRATION_PLAN.md).
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const dirs = process.argv.slice(2).length
	? process.argv.slice(2)
	: ['app', 'server', 'ee', 'lib', 'imports', 'client', 'definition', 'tests'];

const IMPORT_RE = /(?:from\s+|import\s+|(?:import|require)\s*\(\s*)(['"])(\.[^'"]+)\1/g;
const EXT = ['.ts', '.tsx', '.js', '.jsx'];

function getAllFiles(dir) {
	const results = [];
	if (!fs.existsSync(dir)) return results;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) results.push(...getAllFiles(full));
		else if (EXT.some((e) => entry.name.endsWith(e))) results.push(full);
	}
	return results;
}

function resolves(fromFile, spec) {
	const resolved = path.resolve(path.dirname(fromFile), spec);
	const noJsExt = resolved.replace(/\.js$/, '');
	const candidates = [
		resolved,
		...EXT.map((e) => `${resolved}${e}`),
		`${noJsExt}.ts`,
		`${noJsExt}.tsx`,
		...EXT.map((e) => path.join(resolved, `index${e}`)),
		`${resolved}.d.ts`,
		`${resolved}.json`,
		`${resolved}.css`,
		`${resolved}.info`,
	];
	return candidates.some((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

let problems = 0;
for (const dir of dirs) {
	for (const file of getAllFiles(path.join(ROOT, dir))) {
		const content = fs.readFileSync(file, 'utf8');
		for (const m of content.matchAll(IMPORT_RE)) {
			if (!resolves(file, m[2])) {
				console.log(`${path.relative(ROOT, file)}: unresolved import ${m[2]}`);
				problems++;
			}
		}
	}
}
for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
	if (!entry.isFile() || !EXT.some((e) => entry.name.endsWith(e))) continue;
	const file = path.join(ROOT, entry.name);
	const content = fs.readFileSync(file, 'utf8');
	for (const m of content.matchAll(IMPORT_RE)) {
		if (!resolves(file, m[2])) {
			console.log(`${entry.name}: unresolved import ${m[2]}`);
			problems++;
		}
	}
}
console.log(problems ? `\n${problems} unresolved import(s).` : 'All relative imports resolve.');
process.exit(problems ? 1 : 0);
