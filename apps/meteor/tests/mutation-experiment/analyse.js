'use strict';

/**
 * Joins predictors to outcomes and runs the pre-registered analysis.
 * Usage: node analyse.js predictors.json results.jsonl
 */
const fs = require('fs');

const predictors = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const results = fs
	.readFileSync(process.argv[3], 'utf8')
	.split('\n')
	.filter(Boolean)
	.map((l) => JSON.parse(l));

const bySource = new Map(predictors.map((p) => [p.source, p]));

const MIN_MUTANTS = 20;

const joined = [];
const excluded = { rule3: [], rule4: [] };

for (const r of results) {
	const p = bySource.get(r.source);
	if (r.error || r.timedOut || !r.counts) {
		excluded.rule4.push({ source: r.source, error: r.error, timedOut: r.timedOut });
		continue;
	}
	const covered = r.killed + r.survived;
	if (r.total < MIN_MUTANTS) {
		excluded.rule3.push({ source: r.source, total: r.total });
		continue;
	}
	if (covered === 0) {
		excluded.rule3.push({ source: r.source, total: r.total, covered: 0 });
		continue;
	}
	joined.push({ ...p, ...r, covered, score: r.killed / covered });
}

/** Average ranks, ties shared. */
const rank = (values) => {
	const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
	const ranks = new Array(values.length);
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
	return dx === 0 || dy === 0 ? null : num / Math.sqrt(dx * dy);
};

/** Two-sided p from the t approximation. Supporting information; not pre-registered. */
const pValue = (rho, n) => {
	if (rho === null || n < 4) return null;
	const t = Math.abs(rho) * Math.sqrt((n - 2) / (1 - rho * rho));
	const df = n - 2;
	// Incomplete beta via continued fraction.
	const betacf = (a, b, x) => {
		const qab = a + b;
		const qap = a + 1;
		const qam = a - 1;
		let c = 1;
		let d = 1 - (qab * x) / qap;
		if (Math.abs(d) < 1e-30) d = 1e-30;
		d = 1 / d;
		let h = d;
		for (let m = 1; m <= 300; m += 1) {
			const m2 = 2 * m;
			let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
			d = 1 + aa * d;
			if (Math.abs(d) < 1e-30) d = 1e-30;
			c = 1 + aa / c;
			if (Math.abs(c) < 1e-30) c = 1e-30;
			d = 1 / d;
			h *= d * c;
			aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
			d = 1 + aa * d;
			if (Math.abs(d) < 1e-30) d = 1e-30;
			c = 1 + aa / c;
			if (Math.abs(c) < 1e-30) c = 1e-30;
			d = 1 / d;
			const del = d * c;
			h *= del;
			if (Math.abs(del - 1) < 3e-12) break;
		}
		return h;
	};
	const gammaln = (z) => {
		// The Lanczos coefficients, as published. A double holds a little less than they carry, and rounding
		// them to please the linter would be a change to a constant nobody can check.
		// eslint-disable-next-line no-loss-of-precision
		const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
		const x = z;
		let y = z;
		let tmp = x + 5.5;
		tmp -= (x + 0.5) * Math.log(tmp);
		let ser = 1.000000000190015;
		for (let j = 0; j < 6; j += 1) ser += g[j] / ++y;
		return -tmp + Math.log((Math.sqrt(2 * Math.PI) * ser) / x);
	};
	const betai = (a, b, x) => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		const front = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
		return x < (a + 1) / (a + b + 2) ? (front * betacf(a, b, x)) / a : 1 - (front * betacf(b, a, 1 - x)) / b;
	};
	return betai(df / 2, 0.5, df / (df + t * t));
};

const correlate = (name, pick) => {
	const rows = joined.filter((r) => pick(r) !== null && pick(r) !== undefined && Number.isFinite(pick(r)));
	const rho = spearman(
		rows.map(pick),
		rows.map((r) => r.score),
	);
	return { name, n: rows.length, rho, p: pValue(rho, rows.length) };
};

const correlations = [
	correlate('P1 oracle weakness', (r) => r.p1),
	correlate("P1' widened (secondary)", (r) => r.p1Wide),
	correlate('P2 branch density', (r) => r.p2),
	correlate('P3 effect surface', (r) => r.p3),
	correlate('C1 input-domain size', (r) => r.c1),
	correlate('C2 mutant count', (r) => r.total),
];

/** Decision measure: top-quartile recall of the weak specs (score < 60%). */
const WEAK = 0.6;
const topQuartileRecall = (name, pick, direction) => {
	const rows = joined.filter((r) => pick(r) !== null && pick(r) !== undefined && Number.isFinite(pick(r)));
	const weak = rows.filter((r) => r.score < WEAK);
	if (!rows.length || !weak.length) return { name, n: rows.length, weak: weak.length, recall: null };
	const sorted = rows.slice().sort((a, b) => (direction < 0 ? pick(b) - pick(a) : pick(a) - pick(b)));
	const cut = Math.max(1, Math.round(rows.length / 4));
	const quartile = sorted.slice(0, cut);
	const caught = quartile.filter((r) => r.score < WEAK).length;
	return { name, n: rows.length, quartileSize: cut, weak: weak.length, caught, recall: caught / weak.length, precision: caught / cut };
};

const recalls = [
	topQuartileRecall('P1 oracle weakness', (r) => r.p1, -1),
	topQuartileRecall("P1' widened (secondary)", (r) => r.p1Wide, -1),
	topQuartileRecall('P2 branch density', (r) => r.p2, -1),
	topQuartileRecall('P3 effect surface', (r) => r.p3, -1),
	topQuartileRecall('C1 input-domain size', (r) => r.c1, -1),
	topQuartileRecall('C2 mutant count', (r) => r.total, -1),
];

const summary = {
	joined: joined.length,
	excludedRule3: excluded.rule3.length,
	excludedRule4: excluded.rule4.length,
	scores: {
		median: joined.map((r) => r.score).sort((a, b) => a - b)[Math.floor(joined.length / 2)],
		below60: joined.filter((r) => r.score < WEAK).length,
		perfect: joined.filter((r) => r.score === 1).length,
	},
	correlations,
	recalls,
};

fs.writeFileSync('analysis.json', JSON.stringify({ summary, excluded, joined }, null, '\t'));

console.log(`joined ${joined.length} targets; dropped ${excluded.rule3.length} (rule 3) and ${excluded.rule4.length} (rule 4)`);
console.log(
	`median score ${(summary.scores.median * 100).toFixed(0)}%, ${summary.scores.below60} below 60%, ${summary.scores.perfect} at 100%`,
);
console.log('\npredictor                   n     rho      p');
for (const c of correlations)
	console.log(
		`${c.name.padEnd(27)} ${String(c.n).padStart(3)}  ${c.rho === null ? ' n/a ' : c.rho.toFixed(3).padStart(6)}  ${c.p === null ? '' : c.p.toExponential(1)}`,
	);
console.log('\ntop-quartile recall of specs scoring under 60%');
for (const r of recalls)
	console.log(
		`${r.name.padEnd(27)} n=${String(r.n).padStart(3)} quartile=${r.quartileSize} caught ${r.caught}/${r.weak} = ${r.recall === null ? 'n/a' : `${(r.recall * 100).toFixed(0)}%`} (precision ${(r.precision * 100).toFixed(0)}%)`,
	);
