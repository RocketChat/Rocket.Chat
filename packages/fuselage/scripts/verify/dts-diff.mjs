// Usage: node scripts/verify/dts-diff.mjs <git ref A> <git ref B>      per-export diff of the .d.ts Fuselage's build emits at each ref
//        node scripts/verify/dts-diff.mjs --dirs <dist A> <dist B>     the same over two existing dist folders
// Each ref is built in a temporary detached worktree that is removed afterwards. Comments are ignored.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values: opts, positionals } = parseArgs({ allowPositionals: true, options: { dirs: { type: 'boolean', default: false } } });

const run = (cmd, args, cwd) =>
	execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 28 });

// Splits each .d.ts into top-level declarations keyed by file and name.
const exports_ = (dist) => {
	const out = new Map();
	for (const file of readdirSync(dist, { recursive: true })
		.filter((f) => f.endsWith('.d.ts'))
		.sort()) {
		const text = readFileSync(join(dist, file), 'utf8')
			.replaceAll(/\/\*[\s\S]*?\*\//g, '')
			.replaceAll(/^\s*\/\/.*$/gm, '');
		let chunk;
		const seen = new Map();
		const flush = () => {
			if (!chunk) return;
			const name = /\b(?:const|function|class|interface|type|enum|namespace)\s+(\w+)/.exec(chunk[0])?.[1] ?? chunk[0].trim();
			const n = seen.get(name) ?? 0;
			seen.set(name, n + 1);
			out.set(`${file} ${name}${n ? `#${n}` : ''}`, chunk.map((l) => l.trimEnd()).join('\n'));
		};
		for (const line of text.split('\n')) {
			if (!line.trim()) continue;
			if (/^[^\s})\]]/.test(line)) {
				flush();
				chunk = [line];
			} else chunk?.push(line);
		}
		flush();
	}
	return out;
};

const buildAt = (ref) => {
	const root = run('git', ['rev-parse', '--show-toplevel'], process.cwd()).trim();
	const dir = mkdtempSync(join(tmpdir(), 'dts-diff-'));
	run('git', ['worktree', 'add', '--detach', dir, ref], root);
	try {
		run('yarn', ['install'], dir);
		run('yarn', ['workspaces', 'foreach', '-Rpt', '--from', '@rocket.chat/fuselage', 'run', 'build'], dir);
		return exports_(join(dir, 'packages/fuselage/dist'));
	} finally {
		run('git', ['worktree', 'remove', '--force', dir], root);
		rmSync(dir, { recursive: true, force: true });
	}
};

const [a, b] = opts.dirs ? positionals.map(exports_) : positionals.map(buildAt);
let changed = 0;
for (const key of [...new Set([...a.keys(), ...b.keys()])].sort()) {
	if (a.get(key) === b.get(key)) continue;
	changed++;
	if (!a.has(key)) console.log(`+ ${key}`);
	else if (!b.has(key)) console.log(`- ${key}`);
	else {
		console.log(`~ ${key}`);
		const [la, lb] = [new Set(a.get(key).split('\n')), new Set(b.get(key).split('\n'))];
		for (const l of la) if (!lb.has(l)) console.log(`    - ${l.trim()}`);
		for (const l of lb) if (!la.has(l)) console.log(`    + ${l.trim()}`);
	}
}
console.log(`${changed} exports differ`);
