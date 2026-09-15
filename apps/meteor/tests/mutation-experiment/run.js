'use strict';

/**
 * Runs the fast mutation pass over the frame, one target at a time.
 * Usage: node run.js frame.json out.jsonl [limit] [offset]
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const METEOR = path.resolve(__dirname, '..', '..');
// Reports land outside the repo by default, because the driver writes one directory per target.
const SCRATCH = process.env.EXP_OUT || process.cwd();

const frame = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3];
const limit = process.argv[4] ? Number(process.argv[4]) : Infinity;
const offset = process.argv[5] ? Number(process.argv[5]) : 0;

const done = new Set();
if (fs.existsSync(out)) {
	for (const line of fs.readFileSync(out, 'utf8').split('\n').filter(Boolean)) done.add(JSON.parse(line).source);
}

const targets = frame.targets.slice(offset, offset + (limit === Infinity ? frame.targets.length : limit));

for (const [index, target] of targets.entries()) {
	if (done.has(target.source)) continue;

	const slug = target.source.replace(/[^a-zA-Z0-9]/g, '_');
	const reportDir = path.join(SCRATCH, 'reports', slug);
	fs.rmSync(reportDir, { recursive: true, force: true });
	fs.mkdirSync(reportDir, { recursive: true });

	const started = Date.now();
	const result = spawnSync(path.join(METEOR, 'node_modules/.bin/stryker'), ['run', 'stryker.experiment.conf.js'], {
		cwd: METEOR,
		env: {
			...process.env,
			EXP_SPECS: target.specs.join(','),
			EXP_SOURCE: target.source,
			EXP_REPORT_DIR: reportDir,
			EXP_TMP: `.stryker-tmp-${process.pid}`,
		},
		encoding: 'utf8',
		timeout: 900000,
		maxBuffer: 64 * 1024 * 1024,
	});
	const seconds = (Date.now() - started) / 1000;

	const row = { source: target.source, specs: target.specs, seconds, status: result.status, timedOut: result.error?.code === 'ETIMEDOUT' };

	const reportFile = path.join(reportDir, 'mutation.json');
	if (fs.existsSync(reportFile)) {
		const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
		const counts = {};
		for (const mutants of Object.values(report.files)) {
			for (const mutant of mutants.mutants) counts[mutant.status] = (counts[mutant.status] || 0) + 1;
		}
		row.counts = counts;
		row.killed = counts.Killed || 0;
		row.survived = counts.Survived || 0;
		row.timeout = counts.Timeout || 0;
		row.noCoverage = counts.NoCoverage || 0;
		row.runtimeError = counts.RuntimeError || 0;
		row.total = Object.values(counts).reduce((a, b) => a + b, 0);
	} else {
		row.error = (result.stderr || result.stdout || '').split('\n').filter(Boolean).slice(-6).join(' | ').slice(0, 800);
	}

	fs.appendFileSync(out, `${JSON.stringify(row)}\n`);
	const score = row.killed + row.survived > 0 ? ((row.killed / (row.killed + row.survived)) * 100).toFixed(0) : 'n/a';
	console.log(
		`[${offset + index + 1}/${frame.targets.length}] ${seconds.toFixed(0)}s  score=${score}%  ${target.source}${row.error ? `  ERROR ${row.error.slice(0, 120)}` : ''}`,
	);
}
