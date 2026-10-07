// Swaps the platform-specific npm packages of a Meteor bundle built on this machine (macOS) for the
// ones the image's platform needs. Run inside the image's base (node alpine) by ./build-image.sh.
//
// Packages like sharp, esbuild and @napi-rs/pinyin ship their binary as an optional dependency per
// platform, and the bundle only carries the host's. Meteor's npm-rebuild in the Dockerfile rebuilds
// node-gyp modules but cannot fetch these, so the server fails on the first require. CI avoids this by
// building on Linux with every architecture installed.
//
// Usage: node fix-bundle-natives.js <bundle>/programs/server/npm/node_modules

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(process.argv[2] || '');
if (!fs.existsSync(root)) {
	console.error(`not found: ${root}`);
	process.exit(1);
}

const isMusl = fs.existsSync('/etc/alpine-release');
const libc = isMusl ? 'musl' : 'glibc';

const matches = (list, value) => {
	if (!list) {
		return true;
	}
	const allowed = list.filter((v) => !v.startsWith('!'));
	return !list.includes(`!${value}`) && (allowed.length === 0 || allowed.includes(value));
};

const fitsHere = (pkg) => matches(pkg.os, process.platform) && matches(pkg.cpu, process.arch) && matches(pkg.libc, libc);

const readPkg = (dir) => {
	try {
		return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
	} catch {
		return undefined;
	}
};

// Every installed package: { dir, pkg }
const installed = [];
const walk = (nodeModules) => {
	for (const entry of fs.readdirSync(nodeModules, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name.startsWith('.')) {
			continue;
		}
		const dir = path.join(nodeModules, entry.name);
		if (entry.name.startsWith('@')) {
			walk(dir);
			continue;
		}
		const pkg = readPkg(dir);
		if (pkg?.name) {
			installed.push({ dir, pkg });
		}
		const nested = path.join(dir, 'node_modules');
		if (fs.existsSync(nested)) {
			walk(nested);
		}
	}
};
walk(root);

const foreign = installed.filter(({ pkg }) => (pkg.os || pkg.cpu || pkg.libc) && !fitsHere(pkg));
if (foreign.length === 0) {
	console.log(`fix-bundle-natives: nothing to do for ${process.platform}-${process.arch}-${libc}`);
	process.exit(0);
}

// The package that pulls a platform binary in as an optional dependency, closest to where it is installed.
const parentOf = ({ dir, pkg }) => {
	const nodeModulesDir = dir.slice(0, dir.lastIndexOf(`${path.sep}node_modules${path.sep}`) + '/node_modules'.length);
	const scope = path.dirname(nodeModulesDir);
	const candidates = installed
		.filter((p) => p.pkg.optionalDependencies?.[pkg.name] && p.dir.startsWith(scope))
		.sort((a, b) => a.dir.length - b.dir.length);
	return candidates.find((p) => p.pkg.optionalDependencies[pkg.name] === pkg.version) || candidates[0];
};

const work = new Map(); // parent dir -> { parent, nodeModulesDir, foreign: [] }
for (const f of foreign) {
	const parent = parentOf(f);
	if (!parent) {
		console.warn(`fix-bundle-natives: no parent found for ${f.pkg.name}, left as is`);
		continue;
	}
	const nodeModulesDir = f.dir.slice(0, f.dir.length - f.pkg.name.length - 1);
	const key = `${parent.dir}|${nodeModulesDir}`;
	if (!work.has(key)) {
		work.set(key, { parent, nodeModulesDir, foreign: [] });
	}
	work.get(key).foreign.push(f);
}

for (const { parent, nodeModulesDir, foreign: list } of work.values()) {
	const spec = `${parent.pkg.name}@${parent.pkg.version}`;
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'natives-'));
	console.log(`fix-bundle-natives: ${spec}: replacing ${list.map((f) => f.pkg.name).join(', ')}`);
	execFileSync(
		'npm',
		[
			'install',
			'--no-save',
			'--no-package-lock',
			'--ignore-scripts',
			'--omit=dev',
			'--no-audit',
			'--no-fund',
			'--update-notifier=false',
			'--loglevel=error',
			spec,
		],
		{ cwd: tmp, stdio: 'inherit' },
	);

	const fresh = [];
	const collect = (nm) => {
		for (const entry of fs.readdirSync(nm, { withFileTypes: true })) {
			const dir = path.join(nm, entry.name);
			if (entry.name.startsWith('@')) {
				collect(dir);
				continue;
			}
			const pkg = readPkg(dir);
			if (pkg && (pkg.os || pkg.cpu || pkg.libc) && fitsHere(pkg)) {
				fresh.push({ dir, pkg });
			}
		}
	};
	collect(path.join(tmp, 'node_modules'));

	for (const { dir, pkg } of fresh) {
		const target = path.join(nodeModulesDir, pkg.name);
		fs.rmSync(target, { recursive: true, force: true });
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.cpSync(dir, target, { recursive: true });
		console.log(`fix-bundle-natives:   + ${pkg.name}@${pkg.version}`);
	}
	for (const f of list) {
		fs.rmSync(f.dir, { recursive: true, force: true });
		console.log(`fix-bundle-natives:   - ${f.pkg.name}@${f.pkg.version}`);
	}
	fs.rmSync(tmp, { recursive: true, force: true });
}
