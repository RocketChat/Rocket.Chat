#!/usr/bin/env node

/**
 * Scans API endpoint files for weak response schemas — places where
 * `{ type: 'object' }` or `items: { type: 'object' }` are used without
 * properties or $ref, meaning AJV accepts any shape at runtime.
 *
 * Usage:
 *   node scripts/list-weak-response-schemas.mjs          # summary table
 *   node scripts/list-weak-response-schemas.mjs --json    # machine-readable JSON
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SCAN_DIRS = [
	'apps/meteor/app/api/server',
	'apps/meteor/ee/server/api',
];

// ── Helpers ──────────────────────────────────────────────────────────

function walkDir(dir, ext = '.ts') {
	const results = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...walkDir(full, ext));
		} else if (entry.name.endsWith(ext) && !entry.name.endsWith('.spec.ts') && !entry.name.endsWith('.test.ts')) {
			results.push(full);
		}
	}
	return results;
}

/**
 * Extract endpoint names from a file by looking for route registration patterns.
 * Returns a map of line number ranges to endpoint names.
 */
function extractEndpoints(lines) {
	const endpoints = [];
	const routePatterns = [
		// New style: API.v1.get('endpoint.name', ...
		/API\.v1\.(get|post|put|delete)\(\s*['"`]([^'"`]+)['"`]/,
		// Old style: API.v1.addRoute('endpoint.name', ...
		/API\.v1\.addRoute\(\s*['"`]([^'"`]+)['"`]/,
		// Chained: .get('endpoint.name', ...
		/\.(get|post|put|delete)\(\s*\n?\s*['"`]([^'"`]+)['"`]/,
	];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		for (const pattern of routePatterns) {
			const match = line.match(pattern);
			if (match) {
				const name = match[2] || match[1];
				const method = match[1] && ['get', 'post', 'put', 'delete'].includes(match[1]) ? match[1].toUpperCase() : undefined;
				endpoints.push({ name, method, startLine: i + 1 });
			}
		}
	}
	return endpoints;
}

/**
 * Find the closest endpoint for a given line number.
 */
function findEndpointForLine(endpoints, lineNum) {
	let closest = null;
	for (const ep of endpoints) {
		if (ep.startLine <= lineNum) {
			closest = ep;
		}
	}
	return closest;
}

// ── Weak pattern detection ───────────────────────────────────────────

const WEAK_PATTERNS = [
	{
		id: 'bare-object',
		label: '{ type: "object" } without properties or $ref',
		// Matches { type: 'object' } NOT followed by properties or $ref on same/next tokens
		test(line, context) {
			// Match type: 'object' that is likely a bare object (no properties defined)
			if (!line.match(/type:\s*['"]object['"]/)) return false;
			// Exclude lines that also have properties, $ref, allOf, oneOf, anyOf
			if (line.match(/properties\s*:|[\$]ref|\boneOf\b|\banyOf\b|\ballOf\b/)) return false;
			// Exclude lines with additionalProperties: false (intentionally strict)
			// Check if it's an items definition or a standalone property
			return true;
		},
	},
	{
		id: 'bare-array-items',
		label: 'items: { type: "object" } — array with untyped items',
		test(line) {
			return /items:\s*\{\s*type:\s*['"]object['"]\s*\}/.test(line);
		},
	},
	{
		id: 'open-additional-props',
		label: 'additionalProperties: true — accepts any extra properties',
		test(line) {
			return /additionalProperties:\s*true/.test(line);
		},
	},
	{
		id: 'type-object-null',
		label: "type: ['object', 'null'] — nullable object without properties",
		test(line) {
			return /type:\s*\[\s*['"]object['"]\s*,\s*['"]null['"]\s*\]/.test(line);
		},
	},
];

// ── Main scan ────────────────────────────────────────────────────────

const findings = [];

for (const scanDir of SCAN_DIRS) {
	const absDir = join(ROOT, scanDir);
	let files;
	try {
		files = walkDir(absDir);
	} catch {
		continue;
	}

	for (const filePath of files) {
		const relPath = relative(ROOT, filePath);
		const content = readFileSync(filePath, 'utf8');
		const lines = content.split('\n');
		const endpoints = extractEndpoints(lines);

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineNum = i + 1;

			for (const pattern of WEAK_PATTERNS) {
				if (pattern.test(line, { lines, index: i })) {
					// Skip if inside a comment
					const trimmed = line.trim();
					if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

					// Try to determine if this is inside a response schema (compile call)
					// by looking backwards for ajv.compile or response:
					let isResponseSchema = false;
					for (let j = i; j >= Math.max(0, i - 30); j--) {
						if (lines[j].match(/ajv\.compile|response\s*:/)) {
							isResponseSchema = true;
							break;
						}
					}

					const endpoint = findEndpointForLine(endpoints, lineNum);

					findings.push({
						file: relPath,
						line: lineNum,
						endpoint: endpoint ? `${endpoint.method ? endpoint.method + ' ' : ''}${endpoint.name}` : '(schema definition)',
						pattern: pattern.id,
						label: pattern.label,
						code: trimmed,
						isResponseSchema,
					});
				}
			}
		}
	}
}

// ── Output ───────────────────────────────────────────────────────────

const jsonMode = process.argv.includes('--json');

if (jsonMode) {
	console.log(JSON.stringify(findings, null, 2));
} else {
	// Group by pattern
	const grouped = {};
	for (const f of findings) {
		grouped[f.pattern] = grouped[f.pattern] || [];
		grouped[f.pattern].push(f);
	}

	let total = 0;

	for (const [patternId, items] of Object.entries(grouped)) {
		const label = items[0].label;
		console.log(`\n${'─'.repeat(70)}`);
		console.log(`${label} (${items.length} occurrences)`);
		console.log('─'.repeat(70));
		console.log(
			'  ' +
				'File'.padEnd(55) +
				'Line'.padStart(5) +
				'  ' +
				'Endpoint',
		);
		console.log('  ' + '─'.repeat(55) + '─'.repeat(5) + '──' + '─'.repeat(30));

		for (const item of items) {
			const tag = item.isResponseSchema ? '' : ' (non-response)';
			console.log(
				'  ' +
					item.file.padEnd(55) +
					String(item.line).padStart(5) +
					'  ' +
					item.endpoint +
					tag,
			);
		}
		total += items.length;
	}

	console.log(`\n${'═'.repeat(70)}`);
	console.log(`Total: ${total} weak schemas found`);
	console.log('═'.repeat(70));

	if (total > 0) {
		console.log('\nRun with --json for machine-readable output.');
		console.log('See docs/api-endpoint-migration.md for how to replace with $ref.');
	}
}
