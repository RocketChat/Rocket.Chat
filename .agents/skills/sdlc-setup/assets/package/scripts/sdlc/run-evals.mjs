#!/usr/bin/env node
// Runs a package's agent evals: each case is a real task (prompt.md) and a verdict (check.sh).
// Every case gets a fresh worktree at HEAD, so cases cannot see each other's edits and the
// working copy is never touched. Works with any agent that has a non-interactive mode.
//
// Usage:
//   SDLC_AGENT_CMD='claude -p --permission-mode acceptEdits' node scripts/sdlc/run-evals.mjs .
//   node scripts/sdlc/run-evals.mjs . --agent '<command>' [--case <name>]... [--out <dir>]
//                      [--min-pass-rate 1] [--timeout <seconds>]
//
// The agent command receives the prompt as its last argument, or wherever it says {prompt}
// (the text) or {prompt_file} (a path). It runs from the package directory of the worktree.
// check.sh runs from the same directory with SDLC_EVAL_BASE (the commit the case started
// from), SDLC_PACKAGE_DIR and SDLC_REPO_ROOT set, and passes by exiting 0.
// Uncommitted changes are not evaluated: commit the configuration you want to measure.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function parseArgs(argv) {
	const opts = { cases: [], agent: process.env.SDLC_AGENT_CMD, minPassRate: 1, timeout: 900 };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--agent') opts.agent = argv[++i];
		else if (a === '--case') opts.cases.push(argv[++i]);
		else if (a === '--out') opts.out = argv[++i];
		else if (a === '--min-pass-rate') opts.minPassRate = Number(argv[++i]);
		else if (a === '--timeout') opts.timeout = Number(argv[++i]);
		else opts.pkg = a;
	}
	return opts;
}

const quote = (s) => `'${s.replace(/'/g, `'\\''`)}'`;
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function command(agent, prompt, promptFile) {
	if (agent.includes('{prompt_file}')) return agent.replaceAll('{prompt_file}', quote(promptFile));
	if (agent.includes('{prompt}')) return agent.replaceAll('{prompt}', quote(prompt));
	return `${agent} ${quote(prompt)}`;
}

function runCase(name, ctx) {
	const { root, pkgRel, head, agent, timeout, out } = ctx;
	const dir = mkdtempSync(path.join(os.tmpdir(), 'sdlc-eval-'));
	const wt = path.join(dir, 'wt');
	const caseOut = path.join(out, name);
	mkdirSync(caseOut, { recursive: true });
	const started = Date.now();
	try {
		git(['worktree', 'add', '--detach', wt, head], root);
		const pkgDir = path.join(wt, pkgRel);
		const caseDir = path.join(pkgDir, 'evals', name);
		const promptFile = path.join(caseDir, 'prompt.md');
		const prompt = readFileSync(promptFile, 'utf8');
		const env = { ...process.env, SDLC_EVAL: '1', SDLC_EVAL_BASE: head, SDLC_PACKAGE_DIR: pkgDir, SDLC_REPO_ROOT: wt };

		const run = spawnSync('sh', ['-c', command(agent, prompt, promptFile)], { cwd: pkgDir, env, encoding: 'utf8', timeout: timeout * 1000, maxBuffer: 256 * 1024 * 1024 });
		writeFileSync(path.join(caseOut, 'agent.log'), `${run.stdout ?? ''}\n--- stderr ---\n${run.stderr ?? ''}`);
		const timedOut = run.error?.code === 'ETIMEDOUT';

		const check = spawnSync('sh', [path.join(caseDir, 'check.sh')], { cwd: pkgDir, env, encoding: 'utf8' });
		writeFileSync(path.join(caseOut, 'check.log'), `${check.stdout ?? ''}${check.stderr ?? ''}`);

		git(['add', '-A'], wt);
		writeFileSync(path.join(caseOut, 'changes.diff'), git(['diff', '--cached', head], wt));

		const passed = check.status === 0 && !timedOut;
		const verdict = (check.stdout || check.stderr || '').trim().split('\n').pop() ?? '';
		return { name, passed, timedOut, agentExit: run.status, seconds: Math.round((Date.now() - started) / 1000), verdict };
	} catch (e) {
		return { name, passed: false, error: String(e.message ?? e).split('\n')[0], seconds: Math.round((Date.now() - started) / 1000) };
	} finally {
		try {
			git(['worktree', 'remove', '--force', wt], root);
		} catch {}
		rmSync(dir, { recursive: true, force: true });
	}
}

function main() {
	const opts = parseArgs(process.argv.slice(2));
	if (!opts.pkg || !opts.agent) {
		console.error('usage: run-evals.mjs <package-dir> --agent "<command>" (or set SDLC_AGENT_CMD) [--case <name>]... [--out <dir>] [--min-pass-rate 1] [--timeout 900]');
		process.exit(2);
	}
	const pkg = path.resolve(opts.pkg);
	const root = git(['rev-parse', '--show-toplevel'], pkg);
	const pkgRel = path.relative(root, pkg);
	const head = git(['rev-parse', 'HEAD'], root);
	const evalsDir = path.join(pkg, 'evals');
	const all = existsSync(evalsDir)
		? readdirSync(evalsDir).filter((d) => existsSync(path.join(evalsDir, d, 'prompt.md')) && existsSync(path.join(evalsDir, d, 'check.sh')))
		: [];
	const cases = opts.cases.length ? opts.cases : all.sort();
	const unknown = cases.filter((c) => !all.includes(c));
	if (unknown.length) {
		console.error(`unknown or incomplete case(s): ${unknown.join(', ')} (each needs prompt.md and check.sh, committed)`);
		process.exit(2);
	}
	if (git(['status', '--porcelain', '--', path.join(pkgRel, 'evals')], root)) {
		console.error('note: evals/ has uncommitted changes; cases run from HEAD and will not see them');
	}

	const out = path.resolve(opts.out ?? path.join(os.tmpdir(), `sdlc-evals-${path.basename(pkg)}-${Date.now()}`));
	mkdirSync(out, { recursive: true });
	const ctx = { root, pkgRel, head, agent: opts.agent, timeout: opts.timeout, out };
	const results = [];
	for (const name of cases) {
		process.stdout.write(`${name} ... `);
		const r = runCase(name, ctx);
		results.push(r);
		console.log(`${r.passed ? 'pass' : 'FAIL'} (${r.seconds}s)${r.passed ? '' : ` ${r.error ?? (r.timedOut ? 'timed out' : r.verdict)}`}`);
	}

	const passRate = results.length ? results.filter((r) => r.passed).length / results.length : 1;
	const summary = { package: pkgRel, commit: head, agent: opts.agent, passRate, minPassRate: opts.minPassRate, cases: results };
	writeFileSync(path.join(out, 'results.json'), `${JSON.stringify(summary, null, 2)}\n`);
	console.log(`pass rate ${(passRate * 100).toFixed(0)}% (${results.filter((r) => r.passed).length}/${results.length}); logs and diffs in ${out}`);
	process.exit(passRate >= opts.minPassRate ? 0 : 1);
}

main();
