// Reports every evenodd icon whose font glyph would fill a different area than its SVG.

import { relative } from 'path';

import { listFiles, readSource } from './utils.mjs';

const VIEWBOX = 32;
const SIZE = 256;
const SAMPLES = 24;
const THRESHOLD = 0.1;

const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, Z: 0 };

const parseSubpaths = (d) => {
	const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g);
	const subpaths = [];
	let command;
	let x = 0;
	let y = 0;
	let points;

	const sample = (fn) => {
		for (let i = 1; i <= SAMPLES; i++) {
			points.push(fn(i / SAMPLES));
		}
	};

	for (let i = 0; i < tokens.length;) {
		if (/[a-zA-Z]/.test(tokens[i])) {
			command = tokens[i++];
			if (!(command in ARITY)) {
				throw new Error(`unsupported path command ${command}`);
			}
		}
		const args = tokens.slice(i, i + ARITY[command]).map(Number);
		i += ARITY[command];

		switch (command) {
			case 'M':
				[x, y] = args;
				points = [[x, y]];
				subpaths.push(points);
				command = 'L';
				break;
			case 'L':
				[x, y] = args;
				points.push([x, y]);
				break;
			case 'H':
				[x] = args;
				points.push([x, y]);
				break;
			case 'V':
				[y] = args;
				points.push([x, y]);
				break;
			case 'C': {
				const [x0, y0] = [x, y];
				const [x1, y1, x2, y2, x3, y3] = args;
				sample((t) => {
					const u = 1 - t;
					return [
						u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
						u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
					];
				});
				[x, y] = [x3, y3];
				break;
			}
			case 'Z':
				[x, y] = points[0];
				break;
		}
	}

	return subpaths;
};

// winding number of every pixel center around a closed polygon
const addWinding = (winding, polygon) => {
	const step = VIEWBOX / SIZE;
	for (let k = 0; k < polygon.length; k++) {
		const [ax, ay] = polygon[k];
		const [bx, by] = polygon[(k + 1) % polygon.length];
		if (ay === by) continue;
		const direction = by > ay ? 1 : -1;
		const [low, high] = direction > 0 ? [ay, by] : [by, ay];
		for (let row = Math.max(0, Math.ceil(low / step - 0.5)); row < SIZE; row++) {
			const py = (row + 0.5) * step;
			if (py >= high) break;
			const xi = ax + ((bx - ax) * (py - ay)) / (by - ay);
			const columns = Math.min(SIZE, Math.max(0, Math.ceil(xi / step - 0.5)));
			for (let col = 0; col < columns; col++) {
				winding[row * SIZE + col] += direction;
			}
		}
	}
};

const compareFill = (svg) => {
	const svgFill = new Uint8Array(SIZE * SIZE);
	const total = new Int32Array(SIZE * SIZE);

	for (const [, attributes] of svg.matchAll(/<path\b([^>]*)\/?>/g)) {
		const d = /\sd="([^"]*)"/.exec(attributes)[1];
		const evenodd = /fill-rule="evenodd"/.test(attributes);
		const winding = new Int32Array(SIZE * SIZE);
		for (const polygon of parseSubpaths(d)) {
			addWinding(winding, polygon);
		}
		for (let i = 0; i < winding.length; i++) {
			if (evenodd ? winding[i] % 2 !== 0 : winding[i] !== 0) svgFill[i] = 1;
			total[i] += winding[i];
		}
	}

	let extra = 0;
	let missing = 0;
	for (let i = 0; i < total.length; i++) {
		const fontFill = total[i] !== 0;
		if (fontFill && !svgFill[i]) extra++;
		if (!fontFill && svgFill[i]) missing++;
	}

	return { extra: (extra / total.length) * 100, missing: (missing / total.length) * 100 };
};

const rows = [];
for (const path of await listFiles('./src/**/*.svg')) {
	const svg = await readSource(path);
	if (!svg.includes('evenodd')) continue;
	rows.push({ name: relative('./src', path), ...compareFill(svg) });
}

rows.sort((a, b) => b.extra - a.extra || b.missing - a.missing || a.name.localeCompare(b.name));

let broken = 0;
for (const { name, extra, missing } of rows) {
	const flag = extra > THRESHOLD || missing > THRESHOLD ? 'BROKEN' : 'ok';
	if (flag === 'BROKEN') broken++;
	console.log(`${flag.padEnd(6)} extra=${extra.toFixed(2).padStart(6)}%  missing=${missing.toFixed(2).padStart(5)}%  ${name}`);
}
console.log(`${rows.length} evenodd icons checked, ${broken} broken`);

if (broken > 0) {
	process.exitCode = 1;
}
