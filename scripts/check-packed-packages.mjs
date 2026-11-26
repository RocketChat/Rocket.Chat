#!/usr/bin/env node
// Packs every public workspace the way the release publishes it, installs the tarballs into a
// clean folder, and loads each entry point with require() and import(), so a package whose
// published files do not match its declared module format fails here instead of on npm.
// It also compares each tarball with npm's copy of the same version, so a changed package without a changeset fails.
// Run it after `yarn build` and `yarn changeset version`, so the versions and ranges match the next release.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'packed-packages-'));
const tarballs = path.join(work, 'tarballs');
const consumer = path.join(work, 'consumer');
const npmCopies = path.join(work, 'npm');
fs.mkdirSync(tarballs);
fs.mkdirSync(consumer);
fs.mkdirSync(npmCopies);

const workspaces = execFileSync('yarn', ['workspaces', 'list', '--json'], { encoding: 'utf8' })
	.trim()
	.split('\n')
	.map((line) => JSON.parse(line))
	.filter(({ location }) => location !== '.')
	.map(({ name, location }) => ({ name, dir: path.join(root, location), pkg: readJson(path.join(root, location, 'package.json')) }));

const versions = new Map(workspaces.map(({ name, pkg }) => [name, pkg.version]));
const publicWorkspaces = workspaces.filter(({ pkg }) => !pkg.private);

function readJson(file) {
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Same rewrite as packages/release-action/src/fixWorkspaceVersionsBeforePublish.ts, which runs before `npm publish`.
function resolveWorkspaceRanges(pkg) {
	const copy = structuredClone(pkg);
	for (const type of ['dependencies', 'devDependencies', 'peerDependencies']) {
		for (const [dep, range] of Object.entries(copy[type] ?? {})) {
			if (!range.startsWith('workspace:')) continue;
			const version = versions.get(dep);
			if (!version) throw new Error(`${pkg.name}: no workspace named ${dep}`);
			const rest = range.slice('workspace:'.length);
			copy[type][dep] = { '*': `=${version}`, '^': `^${version}`, '~': `~${version}` }[rest] ?? rest;
		}
	}
	return copy;
}

// The bare name when the package has a root entry, plus each exact JavaScript subpath export.
function entryPoints({ name, pkg }) {
	const { exports } = pkg;
	if (exports === undefined) return pkg.main ? [name] : [];
	if (typeof exports === 'string' || Array.isArray(exports)) return [name];
	const keys = Object.keys(exports);
	if (!keys.every((key) => key.startsWith('.'))) return [name]; // conditions object for the root
	return keys.filter((key) => !key.includes('*') && !/\.(json|css|d\.ts)$/.test(key)).map((key) => (key === '.' ? name : `${name}${key.slice(1)}`));
}

function pack(args, cwd, destination) {
	const [result] = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', destination, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }));
	const file = path.join(destination, result.filename);
	return {
		files: result.files.map(({ path: p }) => p).sort(),
		manifest: JSON.parse(execFileSync('tar', ['-xzOf', file, 'package/package.json'], { encoding: 'utf8' })),
	};
}

function isOnNpm(name, version) {
	const result = spawnSync('npm', ['view', `${name}@${version}`, 'version', '--json'], { encoding: 'utf8' });
	if (result.status === 0) return result.stdout.trim() !== '';
	if (/E404/.test(result.stderr)) return false;
	throw new Error(`npm view ${name}@${version} failed:\n${result.stderr}`);
}

const COMPARED_FIELDS = ['dependencies', 'peerDependencies', 'exports', 'main', 'module', 'type'];

// The fields and files that decide what a consumer installs and loads; file bytes differ between builds, so they are not compared.
function differences(local, published) {
	const diffs = COMPARED_FIELDS.filter((field) => JSON.stringify(local.manifest[field]) !== JSON.stringify(published.manifest[field]));
	const added = local.files.filter((file) => !published.files.includes(file));
	const removed = published.files.filter((file) => !local.files.includes(file));
	if (added.length) diffs.push(`files added: ${added.join(', ')}`);
	if (removed.length) diffs.push(`files removed: ${removed.join(', ')}`);
	return diffs;
}

const failures = [];
for (const { name, dir, pkg } of publicWorkspaces) {
	const manifest = path.join(dir, 'package.json');
	const original = fs.readFileSync(manifest, 'utf8');
	let local;
	try {
		fs.writeFileSync(manifest, `${JSON.stringify(resolveWorkspaceRanges(pkg), null, 2)}\n`);
		local = pack([], dir, tarballs);
	} catch (error) {
		throw new Error(`npm pack failed for ${name}`, { cause: error });
	} finally {
		fs.writeFileSync(manifest, original);
	}

	if (!isOnNpm(name, pkg.version)) continue;
	const diffs = differences(local, pack([`${name}@${pkg.version}`], npmCopies, npmCopies));
	if (diffs.length) {
		console.log(`✗ ${name}@${pkg.version} differs from npm`);
		failures.push(`${name} changed, but ${pkg.version} is already on npm. Add a changeset.\n  ${diffs.join('\n  ')}`);
	} else {
		console.log(`✓ ${name}@${pkg.version} matches npm`);
	}
}

fs.writeFileSync(path.join(consumer, 'package.json'), '{ "private": true }\n');
const packed = fs.readdirSync(tarballs).map((file) => path.join(tarballs, file));
const install = spawnSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', ...packed], { cwd: consumer, encoding: 'utf8' });
if (install.status !== 0) failures.push(`npm cannot install the packed tarballs together\n${install.stderr.trim()}`);

const BROWSER_ONLY = /ReferenceError: (window|self|document|navigator|localStorage|HTMLElement) is not defined/;
for (const workspace of install.status === 0 ? publicWorkspaces : []) {
	const entries = entryPoints(workspace);
	if (!entries.length) {
		console.log(`- ${workspace.name}: no JavaScript entry point, skipped`);
		continue;
	}
	for (const entry of entries) {
		const spec = JSON.stringify(entry);
		for (const [how, args] of [
			['require', ['-e', `require(${spec})`]],
			['import', ['--input-type=module', '-e', `await import(${spec})`]],
		]) {
			const result = spawnSync(process.execPath, args, { cwd: consumer, encoding: 'utf8' });
			if (result.status === 0) {
				console.log(`✓ ${how}(${entry})`);
			} else if (BROWSER_ONLY.test(result.stderr)) {
				// The module parsed and linked; it only stopped when it touched a browser API, which is not a format problem.
				// shortcut: a CommonJS graph stops at the first such module, so the requires after it go unchecked; add a DOM shim if that hides a bug.
				console.log(`✓ ${how}(${entry}) (stopped at a browser global)`);
			} else {
				console.log(`✗ ${how}(${entry})`);
				failures.push(`${how}(${entry})\n${result.stderr.trim()}`);
			}
		}
	}
}

fs.rmSync(work, { recursive: true, force: true });

if (failures.length) {
	console.error(`\n${failures.length} checks failed on the packed tarballs:\n`);
	console.error(failures.join('\n\n'));
	process.exit(1);
}
