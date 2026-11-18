// Reports every evenodd icon whose font glyph would fill a different area than its SVG.

import { relative } from 'path';
import { promisify } from 'util';

import { parseString } from 'xml2js';

import { listFiles, readSource } from './utils.mjs';

const VIEWBOX = 32;
const SIZE = 256;
const SAMPLES = 24;

const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, Z: 0 };

const parseSubpaths = (d) => {
	const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g);
	const subpaths = [];
	let command;
	let x = 0;
	let y = 0;
	let start;
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
		} else if (command === undefined || command === 'Z') {
			throw new Error(`number ${tokens[i]} without a path command`);
		}
		if (command !== 'M' && !start) {
			throw new Error(`path starts with ${command} instead of M`);
		}
		if (command !== 'M' && !points) {
			points = [[x, y]];
			subpaths.push(points);
		}
		const args = tokens.slice(i, i + ARITY[command]).map(Number);
		if (args.length < ARITY[command] || args.some(Number.isNaN)) {
			throw new Error(`path command ${command} is missing arguments`);
		}
		i += ARITY[command];

		switch (command) {
			case 'M':
				[x, y] = args;
				start = [x, y];
				points = [start];
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
				[x, y] = start;
				points = undefined;
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

// every <path> with the fill rule it inherits from its ancestors
const collectPaths = (element, fillRule, paths = []) => {
	const rule = element.$?.['fill-rule'] ?? fillRule;
	for (const [name, children] of Object.entries(element)) {
		if (name === '$') continue;
		for (const child of children) {
			const node = typeof child === 'string' ? {} : child;
			if (name === 'path') {
				if (!node.$?.d) {
					throw new Error('<path> without a d attribute');
				}
				paths.push({ d: node.$.d, evenodd: (node.$['fill-rule'] ?? rule) === 'evenodd' });
			} else if (name === 'g') {
				collectPaths(node, rule, paths);
			} else {
				throw new Error(`unsupported element <${name}>`);
			}
		}
	}
	return paths;
};

const compareFill = async (source) => {
	const { svg } = await promisify(parseString)(source);
	const svgFill = new Uint8Array(SIZE * SIZE);
	const total = new Int32Array(SIZE * SIZE);

	for (const { d, evenodd } of collectPaths(svg, 'nonzero')) {
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

	return { extra, missing };
};

const rows = [];
const failures = [];
for (const path of await listFiles('./src/**/*.svg')) {
	const name = relative('./src', path);
	try {
		const source = await readSource(path);
		if (!source.includes('evenodd')) continue;
		rows.push({ name, ...(await compareFill(source)) });
	} catch (error) {
		failures.push({ name, message: error.message });
	}
}

rows.sort((a, b) => b.extra - a.extra || b.missing - a.missing || a.name.localeCompare(b.name));
failures.sort((a, b) => a.name.localeCompare(b.name));

let broken = failures.length;
for (const { name, message } of failures) {
	console.log(`${'ERROR'.padEnd(6)} ${name}: ${message}`);
}
for (const { name, extra, missing } of rows) {
	const flag = extra > 0 || missing > 0 ? 'BROKEN' : 'ok';
	if (flag === 'BROKEN') broken++;
	console.log(`${flag.padEnd(6)} extra=${String(extra).padStart(5)} px  missing=${String(missing).padStart(5)} px  ${name}`);
}
console.log(`${rows.length + failures.length} evenodd icons checked, ${broken} broken`);

if (broken > 0) {
	process.exitCode = 1;
}
