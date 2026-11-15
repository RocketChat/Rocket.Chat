#!/usr/bin/env node
// Checks that every relative link in the docs markdown points to a file that exists
// (with the exact case, as Linux CI sees it) and that #anchors match a heading or
// an <a id> in the target file. External links are skipped.
//
// Usage: node scripts/check-docs-links.mjs [rootDir]   (default: docs)
// Exits 1 if any broken link is found.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, extname, basename, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

// GitHub's slug: lowercase, drop punctuation (Unicode letters and digits survive), one hyphen per space.
export const slug = (text) =>
	text
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
		.replace(/\s/g, '-');

// Blanks the lines inside fenced code blocks; a fence closes only with the same marker, at least as long.
const stripFences = (content) => {
	let fence = null;
	return content.split('\n').map((line) => {
		const m = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
		if (m) {
			if (!fence) {
				fence = m[1];
				return '';
			}
			if (m[1][0] === fence[0] && m[1].length >= fence.length && !m[2].trim()) {
				fence = null;
				return '';
			}
		}
		return fence ? '' : line;
	});
};

const stripCodeSpans = (line) => line.replace(/(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, '');

const anchorsOf = (file) => {
	const anchors = new Set();
	for (const line of stripFences(readFileSync(file, 'utf8'))) {
		for (const m of line.matchAll(/<a\s[^>]*?\b(?:id|name)=["']([^"']+)["']/g)) anchors.add(m[1]);
		const heading = /^ {0,3}#{1,6}\s+(.*?)(?:\s+#+)?\s*$/.exec(line);
		if (!heading) continue;
		const base = slug(heading[1].replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1'));
		let candidate = base;
		for (let n = 1; anchors.has(candidate); n++) candidate = `${base}-${n}`;
		anchors.add(candidate);
	}
	return anchors;
};

// existsSync is case-insensitive on macOS, so compare every segment against the real directory listing.
const existsExact = (path) => {
	if (!existsSync(path)) return false;
	const { root } = parse(path);
	let current = root;
	for (const segment of path.slice(root.length).split(/[\\/]/).filter(Boolean)) {
		if (!readdirSync(current).includes(segment)) return false;
		current = join(current, segment);
	}
	return true;
};

const decode = (value) => {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
};

// ponytail: link targets containing ")", setext headings and indented code blocks are not parsed; none exist in docs yet.
const inlineLinkRe = /\]\(\s*(<[^>]*>|[^)\s]+)/g;
const htmlLinkRe = /<a\s[^>]*?\bhref=["']([^"']+)["']/g;
const referenceLinkRe = /^ {0,3}\[[^\]]+\]:\s*(<[^>]*>|\S+)/;

export const checkLinks = (root, repoRoot = process.cwd()) => {
	const mdFiles = readdirSync(root, { recursive: true })
		.map((p) => join(root, p.toString()))
		.filter((p) => extname(p) === '.md' && statSync(p).isFile());

	const anchorCache = new Map();
	const getAnchors = (file) => {
		if (!anchorCache.has(file)) anchorCache.set(file, anchorsOf(file));
		return anchorCache.get(file);
	};

	const errors = [];
	for (const file of mdFiles) {
		const lines = stripFences(readFileSync(file, 'utf8')).map(stripCodeSpans);
		// Inline and HTML links may break across lines; reference definitions are one per line.
		const text = lines.join('\n');
		const targets = [
			...[...text.matchAll(inlineLinkRe)].map((m) => m[1]),
			...[...text.matchAll(htmlLinkRe)].map((m) => m[1]),
			...lines.flatMap((line) => referenceLinkRe.exec(line)?.slice(1) ?? []),
		];

		for (let target of targets) {
			if (target.startsWith('<')) target = target.slice(1, -1);
			if (!target || target.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;

			const hashIndex = target.indexOf('#');
			const path = decode(hashIndex === -1 ? target : target.slice(0, hashIndex));
			const anchor = hashIndex === -1 ? '' : decode(target.slice(hashIndex + 1));

			if (!path) {
				if (anchor && !getAnchors(file).has(anchor)) errors.push(`${file}: missing anchor #${anchor} (same file)`);
				continue;
			}

			const resolved = path.startsWith('/') ? join(repoRoot, path) : resolve(dirname(file), path);
			if (!existsExact(resolve(resolved))) {
				errors.push(`${file}: broken link -> ${target}`);
				continue;
			}
			if (anchor && extname(resolved) === '.md' && !getAnchors(resolved).has(anchor)) {
				errors.push(`${file}: missing anchor #${anchor} in ${basename(resolved)}`);
			}
		}
	}
	return { files: mdFiles.length, errors };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = process.argv[2] ?? 'docs';
	if (!existsSync(root)) {
		console.error(`✗ docs root not found: ${root}`);
		process.exit(1);
	}
	const { files, errors } = checkLinks(root);
	if (errors.length) {
		console.error(`✗ ${errors.length} broken doc link(s):\n`);
		for (const e of errors) console.error(`  ${e}`);
		process.exit(1);
	}
	console.log(`✓ docs links OK (${files} files checked)`);
}
