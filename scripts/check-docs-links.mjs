#!/usr/bin/env node
// Zero-dependency internal link checker for the /docs folder.
//
// Verifies that every relative markdown link inside docs/**/*.md points to a
// file that exists, and that #anchors resolve to a real heading in the target
// file. External links (http/https/mailto/tel) are ignored.
//
// Usage: node scripts/check-docs-links.mjs [rootDir]   (default: docs)
// Exits 1 if any broken link is found.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';

const root = process.argv[2] ?? 'docs';

if (!existsSync(root)) {
	console.error(`✗ docs root not found: ${root}`);
	process.exit(1);
}

/** Collect all markdown files under root. */
const mdFiles = readdirSync(root, { recursive: true })
	.map((p) => join(root, p.toString()))
	.filter((p) => extname(p) === '.md' && statSync(p).isFile());

/** GitHub-style heading slug (good enough for our simple headings). */
const slug = (text) =>
	text
		.trim()
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s/g, '-'); // GitHub maps each space to a hyphen (no collapsing)

/** Lines that are inside a fenced code block (``` or ~~~) don't render. */
const stripFences = (content) => {
	let inFence = false;
	return content.split('\n').map((line) => {
		if (/^\s*(```|~~~)/.test(line)) {
			inFence = !inFence;
			return '';
		}
		return inFence ? '' : line;
	});
};

/** Extract heading anchors from a markdown file (ignoring code fences). */
const anchorsOf = (file) => {
	const set = new Set();
	for (const line of stripFences(readFileSync(file, 'utf8'))) {
		const m = /^#{1,6}\s+(.*)$/.exec(line);
		if (m) set.add(slug(m[1]));
	}
	return set;
};

const anchorCache = new Map();
const getAnchors = (file) => {
	if (!anchorCache.has(file)) anchorCache.set(file, anchorsOf(file));
	return anchorCache.get(file);
};

const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
const errors = [];

for (const file of mdFiles) {
	const content = stripFences(readFileSync(file, 'utf8')).join('\n');
	for (const match of content.matchAll(linkRe)) {
		// strip optional "title" and surrounding whitespace
		let target = match[1].trim().split(/\s+/)[0];
		if (!target) continue;
		if (/^(https?:|mailto:|tel:|#)/i.test(target) && !target.startsWith('#')) continue;

		const [path, anchor] = target.split('#');

		// same-file anchor
		if (!path) {
			if (anchor && !getAnchors(file).has(anchor)) {
				errors.push(`${file}: missing anchor #${anchor} (same file)`);
			}
			continue;
		}

		const resolved = resolve(dirname(file), path);
		if (!existsSync(resolved)) {
			errors.push(`${file}: broken link -> ${target}`);
			continue;
		}
		if (anchor && extname(resolved) === '.md' && !getAnchors(resolved).has(anchor)) {
			errors.push(`${file}: missing anchor #${anchor} in ${path}`);
		}
	}
}

if (errors.length) {
	console.error(`✗ ${errors.length} broken doc link(s):\n`);
	for (const e of errors) console.error(`  ${e}`);
	process.exit(1);
}

console.log(`✓ docs links OK (${mdFiles.length} files checked)`);
