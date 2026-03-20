#!/usr/bin/env node

/**
 * Analyzes REST API endpoint typings for "weak" types.
 *
 * Weak types are generic types that provide little or no type safety:
 *   - `any` / `unknown`
 *   - `object` (bare)
 *   - `Record<string, any>` / `Record<string, unknown>`
 *   - `Array<any>` / `any[]`
 *   - `{ [key: string]: any }` index signatures
 *   - `Partial<IMessage>` (very broad when used as request param)
 *   - JSON Schema `{ type: 'object' }` with no `properties`
 *
 * Usage:
 *   node scripts/analyze-weak-types.mjs [--json] [--schema-only] [--ts-only]
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';

const REST_TYPINGS_DIR = join(import.meta.dirname, '..', 'packages', 'rest-typings', 'src');

const outputJson = process.argv.includes('--json');
const schemaOnly = process.argv.includes('--schema-only');
const tsOnly = process.argv.includes('--ts-only');

// ── Weak-type patterns ──────────────────────────────────────────────

// TypeScript-level weak patterns
const TS_WEAK_PATTERNS = [
	{ regex: /:\s*any\b/g, label: 'any' },
	{ regex: /:\s*unknown\b/g, label: 'unknown' },
	{ regex: /:\s*object\b/g, label: 'object' },
	{ regex: /Record<string,\s*any>/g, label: 'Record<string, any>' },
	{ regex: /Record<string,\s*unknown>/g, label: 'Record<string, unknown>' },
	{ regex: /Array<any>/g, label: 'Array<any>' },
	{ regex: /:\s*any\[\]/g, label: 'any[]' },
	{ regex: /\[\s*key\s*:\s*string\s*\]\s*:\s*any/g, label: '{ [key: string]: any }' },
	{ regex: /\bPartial<IMessage>/g, label: 'Partial<IMessage>' },
	{ regex: /\bPartial<IRoom>/g, label: 'Partial<IRoom>' },
	{ regex: /\bPartial<IUser>/g, label: 'Partial<IUser>' },
];

// JSON Schema-level weak patterns (in AJV schemas)
const SCHEMA_WEAK_PATTERNS = [
	{
		// { type: 'object' } without properties key on same or next lines
		regex: /type:\s*'object'(?![\s\S]{0,80}properties\s*:)/gm,
		label: "schema: { type: 'object' } (no properties)",
		multiline: true,
	},
	{
		regex: /type:\s*'array',?\s*\n?\s*(?:nullable:\s*(?:true|false),?\s*\n?\s*)?(?:}\s*,|},)/gm,
		label: "schema: { type: 'array' } (no items)",
		multiline: true,
	},
];

// ── File walker ─────────────────────────────────────────────────────

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walk(full)));
		} else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') && !entry.name.endsWith('.test.ts')) {
			files.push(full);
		}
	}
	return files;
}

// ── Endpoint extractor ──────────────────────────────────────────────

/**
 * Given a file, extract all endpoint paths with their character positions.
 * Returns array of { endpoint, pos } sorted by pos.
 */
function extractEndpointsWithPositions(content) {
	const results = [];
	const re = /['"]\/v[12]\/[^'"]+['"]\s*:/g;
	let m;
	while ((m = re.exec(content)) !== null) {
		results.push({
			endpoint: m[0].replace(/['":\s]/g, ''),
			pos: m.index,
		});
	}
	return results;
}

/**
 * Given a character position and a list of endpoint positions,
 * find the nearest preceding endpoint (the one this code belongs to).
 */
function findNearestEndpoint(charPos, endpointPositions) {
	let nearest = null;
	for (const ep of endpointPositions) {
		if (ep.pos <= charPos) {
			nearest = ep.endpoint;
		} else {
			break;
		}
	}
	return nearest;
}

/**
 * Try to map a type name (e.g. ChatSendMessage) back to an endpoint path.
 * Looks at the Endpoints type definition for the function signature that uses it.
 */
function mapTypeToEndpoint(typeName, content) {
	// Search for endpoint definitions that reference this type
	const re = new RegExp(`['"](\\/v[12]\\/[^'"]+)['"]\\s*:\\s*\\{[^}]*?${typeName}`, 'g');
	const matches = [];
	let m;
	while ((m = re.exec(content)) !== null) {
		matches.push(m[1]);
	}
	return matches;
}

// ── Schema block analyzer ───────────────────────────────────────────

/**
 * Find schema objects that have type: 'object' but NO `properties` key
 * within the same block. This is more accurate than regex for nested schemas.
 */
function findWeakSchemaBlocks(content) {
	const results = [];

	// Find all occurrences of `type: 'object'`
	const typeObjRe = /type:\s*'object'/g;
	let match;
	while ((match = typeObjRe.exec(content)) !== null) {
		const pos = match.index;

		// Walk backwards to find the opening `{` of this schema object
		let braceDepth = 0;
		let blockStart = pos;
		for (let i = pos - 1; i >= 0; i--) {
			if (content[i] === '}') braceDepth++;
			if (content[i] === '{') {
				if (braceDepth === 0) {
					blockStart = i;
					break;
				}
				braceDepth--;
			}
		}

		// Walk forward to find the closing `}` of this schema object
		braceDepth = 0;
		let blockEnd = pos;
		for (let i = blockStart; i < content.length; i++) {
			if (content[i] === '{') braceDepth++;
			if (content[i] === '}') {
				braceDepth--;
				if (braceDepth === 0) {
					blockEnd = i + 1;
					break;
				}
			}
		}

		const block = content.slice(blockStart, blockEnd);

		// Check if this block has a `properties` key at depth 1
		// (i.e. direct child, not nested)
		let hasProperties = false;
		let depth = 0;
		for (let i = 0; i < block.length; i++) {
			if (block[i] === '{') depth++;
			if (block[i] === '}') depth--;
			if (depth === 1 && block.slice(i).match(/^properties\s*:/)) {
				hasProperties = true;
				break;
			}
		}

		if (!hasProperties) {
			// Get the line number
			const lineNum = content.slice(0, pos).split('\n').length;

			// Try to find the property name (e.g. `attachments: {`)
			const beforeBlock = content.slice(Math.max(0, blockStart - 120), blockStart);
			const propMatch = beforeBlock.match(/(\w+)\s*:\s*$/);
			const propName = propMatch ? propMatch[1] : '(unknown property)';

			results.push({
				line: lineNum,
				property: propName,
				label: `schema: '${propName}' is { type: 'object' } with no properties`,
			});
		}
	}

	return results;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
	const files = await walk(REST_TYPINGS_DIR);

	/** @type {Map<string, { file: string, line: number, label: string, property?: string, endpoints: string[] }[]>} */
	const findings = new Map();
	let totalFindings = 0;

	// We also need to read "parent" endpoint files to map prop types → endpoints
	/** @type {Map<string, string>} */
	const endpointFileContents = new Map();

	// First pass: identify endpoint definition files (files containing endpoint path patterns)
	for (const file of files) {
		const content = await readFile(file, 'utf-8');
		const epPositions = extractEndpointsWithPositions(content);
		if (epPositions.length > 0) {
			endpointFileContents.set(file, content);
		}
	}

	// Second pass: scan all files for weak types
	for (const file of files) {
		const content = await readFile(file, 'utf-8');
		const relPath = relative(REST_TYPINGS_DIR, file);
		const lines = content.split('\n');
		const fileFindings = [];
		const epPositions = extractEndpointsWithPositions(content);

		// Check TS-level patterns
		if (!schemaOnly) {
			for (const pattern of TS_WEAK_PATTERNS) {
				const re = new RegExp(pattern.regex.source, pattern.regex.flags);
				let m;
				while ((m = re.exec(content)) !== null) {
					// Skip if in a comment
					const lineIdx = content.slice(0, m.index).split('\n').length - 1;
					const line = lines[lineIdx];
					if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

					// Skip imports
					if (line.trimStart().startsWith('import ')) continue;

					const lineNum = lineIdx + 1;

					// Try to find which type/interface this belongs to
					let typeName = null;
					for (let i = lineIdx; i >= 0; i--) {
						const tm = lines[i].match(/(?:type|interface)\s+(\w+)/);
						if (tm) {
							typeName = tm[1];
							break;
						}
					}

					// Try to find associated endpoint using position-based mapping
					let endpoints = [];

					// If this file has endpoints, find the nearest one
					if (epPositions.length > 0) {
						const nearest = findNearestEndpoint(m.index, epPositions);
						if (nearest) endpoints.push(nearest);
					}

					// If no endpoint found in this file, search other endpoint files by type name
					if (endpoints.length === 0 && typeName) {
						for (const [epFile, epContent] of endpointFileContents) {
							const mapped = mapTypeToEndpoint(typeName, epContent);
							if (mapped.length > 0) {
								endpoints.push(...mapped);
							}
						}
					}

					// If we still have no endpoint, try to infer from file name
					if (endpoints.length === 0) {
						const name = basename(file, '.ts');
						const endpointMatch = name.match(/^([A-Z][a-z]+)([A-Z]\w+?)Props$/);
						if (endpointMatch) {
							const resource = endpointMatch[1].toLowerCase();
							const action = endpointMatch[2].charAt(0).toLowerCase() + endpointMatch[2].slice(1);
							endpoints.push(`/v1/${resource}.${action}`);
						}
					}

					fileFindings.push({
						file: relPath,
						line: lineNum,
						label: pattern.label,
						typeName,
						snippet: line.trim(),
						endpoints: [...new Set(endpoints)],
					});
				}
			}
		}

		// Check schema-level patterns
		if (!tsOnly) {
			const schemaFindings = findWeakSchemaBlocks(content);
			for (const sf of schemaFindings) {
				let endpoints = [];

				// Use position-based mapping for schemas too
				if (epPositions.length > 0) {
					// Find char position from line number
					let charPos = 0;
					for (let i = 0; i < sf.line - 1; i++) {
						charPos += lines[i].length + 1;
					}
					const nearest = findNearestEndpoint(charPos, epPositions);
					if (nearest) endpoints.push(nearest);
				}

				// Fallback: try to infer from file name
				if (endpoints.length === 0) {
					const name = basename(file, '.ts');
					const endpointMatch = name.match(/^([A-Z][a-z]+)([A-Z]\w+?)Props$/);
					if (endpointMatch) {
						const resource = endpointMatch[1].toLowerCase();
						const action = endpointMatch[2].charAt(0).toLowerCase() + endpointMatch[2].slice(1);
						endpoints.push(`/v1/${resource}.${action}`);
					}
				}

				fileFindings.push({
					file: relPath,
					line: sf.line,
					label: sf.label,
					property: sf.property,
					snippet: lines[sf.line - 1]?.trim() || '',
					endpoints: [...new Set(endpoints)],
				});
			}
		}

		if (fileFindings.length > 0) {
			findings.set(relPath, fileFindings);
			totalFindings += fileFindings.length;
		}
	}

	// ── Output ────────────────────────────────────────────────────

	if (outputJson) {
		const allFindings = [];
		for (const [, items] of findings) {
			allFindings.push(...items);
		}
		console.log(JSON.stringify(allFindings, null, 2));
		return;
	}

	// Group by endpoint
	/** @type {Map<string, { file: string, line: number, label: string, snippet: string }[]>} */
	const byEndpoint = new Map();
	/** @type {{ file: string, line: number, label: string, snippet: string }[]} */
	const unmapped = [];

	for (const [, items] of findings) {
		for (const item of items) {
			if (item.endpoints.length === 0) {
				unmapped.push(item);
			} else {
				for (const ep of item.endpoints) {
					if (!byEndpoint.has(ep)) byEndpoint.set(ep, []);
					byEndpoint.get(ep).push(item);
				}
			}
		}
	}

	// Summary by weak-type label
	const labelCounts = new Map();
	for (const [, items] of findings) {
		for (const item of items) {
			labelCounts.set(item.label, (labelCounts.get(item.label) || 0) + 1);
		}
	}

	console.log('╔══════════════════════════════════════════════════════════════════╗');
	console.log('║           REST API — Weak Type Analysis Report                  ║');
	console.log('╚══════════════════════════════════════════════════════════════════╝');
	console.log();

	// Summary
	console.log(`Total weak-type occurrences: ${totalFindings}`);
	console.log(`Files affected: ${findings.size}`);
	console.log(`Endpoints affected: ${byEndpoint.size}`);
	console.log();

	console.log('── Summary by Type ────────────────────────────────────────────────');
	const sorted = [...labelCounts.entries()].sort((a, b) => b[1] - a[1]);
	for (const [label, count] of sorted) {
		console.log(`  ${String(count).padStart(4)}  ${label}`);
	}
	console.log();

	// By endpoint
	console.log('── By Endpoint ────────────────────────────────────────────────────');
	const sortedEndpoints = [...byEndpoint.entries()].sort((a, b) => b[1].length - a[1].length);
	for (const [endpoint, items] of sortedEndpoints) {
		console.log();
		console.log(`  ${endpoint}  (${items.length} issue${items.length > 1 ? 's' : ''})`);
		for (const item of items) {
			console.log(`    ├─ ${item.label}`);
			console.log(`    │  ${item.file}:${item.line}`);
			console.log(`    │  ${item.snippet.slice(0, 100)}`);
		}
	}

	if (unmapped.length > 0) {
		console.log();
		console.log('── Unmapped (could not resolve endpoint) ──────────────────────────');
		for (const item of unmapped) {
			console.log(`    ├─ ${item.label}`);
			console.log(`    │  ${item.file}:${item.line}`);
			console.log(`    │  ${item.snippet.slice(0, 100)}`);
		}
	}

	console.log();
	console.log('── Done ───────────────────────────────────────────────────────────');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
