'use strict';

/**
 * Post-hoc sensitivity check, not pre-registered.
 *
 * The whole-file `mutate` includes module-level lines — `mime.types.wav = 'audio/wav'` and the like.
 * Those lines run on import, so they count as covered, but no unit test can assert them. This recomputes
 * the outcome over mutants inside a block only, and reports whether any correlation moves.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRATCH = process.env.EXP_OUT || process.cwd();

/** Brace depth at the start of each line, strings and comments skipped. */
const depthByLine = (text) => {
	const depths = [];
	let depth = 0;
	let inBlockComment = false;
	for (const line of text.split('\n')) {
		depths.push(depth);
		for (let i = 0; i < line.length; i += 1) {
			const c = line[i];
			if (inBlockComment) {
				if (c === '*' && line[i + 1] === '/') {
					inBlockComment = false;
					i += 1;
				}
				continue;
			}
			if (c === '/' && line[i + 1] === '/') break;
			if (c === '/' && line[i + 1] === '*') {
				inBlockComment = true;
				i += 1;
				continue;
			}
			if (c === "'" || c === '"' || c === '`') {
				const quote = c;
				i += 1;
				while (i < line.length && line[i] !== quote) i += line[i] === '\\' ? 2 : 1;
				continue;
			}
			if (c === '{') depth += 1;
			else if (c === '}') depth = Math.max(0, depth - 1);
		}
	}
	return depths;
};

const analysis = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'analysis.json'), 'utf8'));
const rows = [];

for (const row of analysis.joined) {
	const slug = row.source.replace(/[^a-zA-Z0-9]/g, '_');
	const reportFile = path.join(SCRATCH, 'reports', slug, 'mutation.json');
	if (!fs.existsSync(reportFile)) continue;
	const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));

	let killed = 0;
	let survived = 0;
	let topLevelSurvived = 0;
	for (const [file, data] of Object.entries(report.files)) {
		const depths = depthByLine(fs.readFileSync(path.join(ROOT, file), 'utf8'));
		for (const mutant of data.mutants) {
			const topLevel = (depths[mutant.location.start.line - 1] || 0) === 0;
			if (topLevel) {
				if (mutant.status === 'Survived') topLevelSurvived += 1;
				continue;
			}
			if (mutant.status === 'Killed') killed += 1;
			else if (mutant.status === 'Survived') survived += 1;
		}
	}
	if (killed + survived < 20) continue;
	rows.push({ ...row, blockKilled: killed, blockSurvived: survived, topLevelSurvived, blockScore: killed / (killed + survived) });
}

const rank = (values) => {
	const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
	const ranks = [];
	let i = 0;
	while (i < order.length) {
		let j = i;
		while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j += 1;
		const shared = (i + j) / 2 + 1;
		for (let k = i; k <= j; k += 1) ranks[order[k][1]] = shared;
		i = j + 1;
	}
	return ranks;
};
const spearman = (xs, ys) => {
	const rx = rank(xs);
	const ry = rank(ys);
	const n = xs.length;
	const mean = (a) => a.reduce((s, v) => s + v, 0) / n;
	const mx = mean(rx);
	const my = mean(ry);
	let num = 0;
	let dx = 0;
	let dy = 0;
	for (let i = 0; i < n; i += 1) {
		num += (rx[i] - mx) * (ry[i] - my);
		dx += (rx[i] - mx) ** 2;
		dy += (ry[i] - my) ** 2;
	}
	return num / Math.sqrt(dx * dy);
};

const p1rows = rows.filter((r) => r.p1 !== null);
console.log(`targets kept: ${rows.length} (of ${analysis.joined.length})`);
console.log(`module-level survivors removed: ${rows.reduce((s, r) => s + r.topLevelSurvived, 0)}`);
console.log('');
console.log('predictor            rho (whole file)  rho (inside blocks)');
const show = (name, pick, set) => {
	const s = set || rows;
	console.log(
		`${name.padEnd(20)} ${spearman(
			s.map(pick),
			s.map((r) => r.score),
		)
			.toFixed(3)
			.padStart(8)}          ${spearman(
			s.map(pick),
			s.map((r) => r.blockScore),
		)
			.toFixed(3)
			.padStart(8)}`,
	);
};
show('P1 oracle weakness', (r) => r.p1, p1rows);
show('P2 branch density', (r) => r.p2);
show('P3 effect surface', (r) => r.p3);
show('C1 input domain', (r) => r.c1);
show('source lines', (r) => r.lines);

const WEAK = 0.6;
const weak = rows.filter((r) => r.blockScore < WEAK).length;
const cut = Math.round(rows.length / 4);
const byP3 = rows
	.slice()
	.sort((a, b) => b.p3 - a.p3)
	.slice(0, cut)
	.filter((r) => r.blockScore < WEAK).length;
console.log('');
console.log(`inside blocks: ${weak} targets below 60%; P3 top quartile catches ${byP3}/${weak} = ${((byP3 / weak) * 100).toFixed(0)}%`);
