#!/usr/bin/env node

/**
 * Disposable migration helper: verifies proxyquire/jest.mock string literals.
 *
 * - proxyquire `.load('<target>', { '<key>': ... })`: the target must resolve to
 *   a real file, and every relative key must literally match an import specifier
 *   used by the loaded module (proxyquire matches keys literally).
 * - `jest.mock('<key>')`: a relative key must resolve to a real file from the
 *   spec's directory.
 *
 * Scans all *.spec.ts / *.tests.{ts,js} under the given dirs (default: app,
 * server, ee, tests, imports).
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : ['app', 'server', 'ee', 'tests', 'imports'];

function getAllFiles(dir) {
	const results = [];
	if (!fs.existsSync(dir)) return results;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) results.push(...getAllFiles(full));
		else if (/\.(spec|tests)\.(ts|js)$/.test(entry.name)) results.push(full);
	}
	return results;
}

function resolveModule(fromDir, spec) {
	const resolved = path.resolve(fromDir, spec);
	const noJsExt = resolved.replace(/\.js$/, '');
	for (const c of [
		resolved,
		`${resolved}.ts`,
		`${resolved}.tsx`,
		`${resolved}.js`,
		`${noJsExt}.ts`,
		path.join(resolved, 'index.ts'),
		path.join(resolved, 'index.js'),
	]) {
		if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
	}
	return null;
}

let problems = 0;
for (const dir of dirs) {
	for (const specFile of getAllFiles(path.join(ROOT, dir))) {
		const content = fs.readFileSync(specFile, 'utf8');
		const rel = path.relative(ROOT, specFile);

		// jest.mock relative keys must resolve from the spec's dir
		for (const m of content.matchAll(/jest\.mock\(\s*(['"])(\.[^'"]+)\1/g)) {
			if (!resolveModule(path.dirname(specFile), m[2])) {
				console.log(`${rel}: jest.mock key does not resolve: ${m[2]}`);
				problems++;
			}
		}

		// proxyquire targets + literal keys
		for (const m of content.matchAll(/\.load\(\s*(['"])(\.[^'"]+)\1\s*,/g)) {
			const target = m[2];
			const targetFile = resolveModule(path.dirname(specFile), target);
			if (!targetFile) {
				console.log(`${rel}: proxyquire target does not resolve: ${target}`);
				problems++;
				continue;
			}
			const modContent = fs.readFileSync(targetFile, 'utf8');
			const modSpecifiers = new Set(
				[...modContent.matchAll(/(?:from\s+|import\s+|(?:import|require)\s*\(\s*)(['"])([^'"]+)\1/g)].map((x) => x[2]),
			);
			// keys of the stub object immediately following this .load( target,
			// only when the second argument is an inline object literal
			const after = content.slice(m.index + m[0].length);
			if (!/^\s*\{/.test(after)) continue;
			const open = after.indexOf('{');
			// naive brace matching to find the stubs object end
			let depth = 0;
			let end = open;
			for (let i = open; i < after.length; i++) {
				if (after[i] === '{') depth++;
				else if (after[i] === '}') {
					depth--;
					if (depth === 0) {
						end = i;
						break;
					}
				}
			}
			const stubs = after.slice(open, end + 1);
			for (const k of stubs.matchAll(/(['"])(\.[^'"]+)\1\s*:/g)) {
				if (!modSpecifiers.has(k[2])) {
					console.log(`${rel}: stale proxyquire key for ${path.relative(ROOT, targetFile)}: ${k[2]}`);
					problems++;
				}
			}
		}
	}
}
console.log(problems ? `\n${problems} problem(s) found.` : 'All mock keys OK.');
process.exit(problems ? 1 : 0);
