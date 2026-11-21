#!/usr/bin/env node
// Stops an agent, while it works, from making the two edits a spec-first package forbids:
// editing an ADR that is already merged, and weakening a test that pins a known defect.
// sdlc-check.mjs (the package's sdlc:check) enforces the same rules for every agent and person; this guard
// catches them at the moment of the edit so the agent can change course.
//
// Input: a pre-edit hook payload on stdin, in Claude Code's PreToolUse shape:
//   { "tool_name": "Edit" | "MultiEdit" | "Write",
//     "tool_input": { "file_path", "old_string", "new_string", "edits": [...], "content" },
//     "cwd": "..." }
// Any agent whose hooks can produce that JSON can call it. Exit 2 blocks the edit and the
// reason goes to stderr; exit 0 allows it. It fails open: sdlc:check is the backstop.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { normalizeBlock, pinnedBlocks } from './sdlc-check.mjs';

const MARKER = path.join('docs', 'templates', 'spec.md');

function readStdin() {
	try {
		return JSON.parse(readFileSync(0, 'utf8'));
	} catch {
		return null;
	}
}

function packageOf(file) {
	let dir = path.dirname(file);
	while (dir !== path.dirname(dir)) {
		if (existsSync(path.join(dir, MARKER))) return dir;
		dir = path.dirname(dir);
	}
	return null;
}

function git(args, cwd) {
	try {
		return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return null;
	}
}

// The branch merged work lands on: SDLC_BASE when set, else the remote's default branch.
function baseRef(cwd) {
	const candidates = [process.env.SDLC_BASE, 'origin/HEAD', 'origin/develop', 'origin/main'].filter(Boolean);
	return candidates.find((ref) => git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], cwd) !== null) ?? null;
}

function edits(input) {
	if (Array.isArray(input.edits)) return input.edits;
	if (typeof input.old_string === 'string') return [{ old_string: input.old_string, new_string: input.new_string ?? '' }];
	return [];
}

function block(reason) {
	process.stderr.write(`${reason}\n`);
	process.exit(2);
}

function guardAdr(file, pkg, payload) {
	if (!/^\d{4}-.+\.md$/.test(path.basename(file)) || path.dirname(file) !== path.join(pkg, 'docs', 'adr')) return;
	if (!existsSync(file)) return;
	const root = git(['rev-parse', '--show-toplevel'], pkg);
	const base = root && baseRef(root);
	if (!base) return;
	if (git(['cat-file', '-e', `${base}:${path.relative(root, file).split(path.sep).join('/')}`], root) === null) return;

	const statusOnly = (a, b) => {
		const strip = (t) => t.split('\n').filter((l) => !/Status:/.test(l)).join('\n');
		return strip(a) === strip(b);
	};
	const current = readFileSync(file, 'utf8');
	const ok =
		payload.tool_name === 'Write'
			? statusOnly(current, payload.tool_input.content ?? '')
			: edits(payload.tool_input).every((e) => statusOnly(e.old_string, e.new_string));
	if (!ok) {
		block(
			`${path.relative(pkg, file)} is a merged ADR, and merged ADRs are never edited. ` +
				'Write a new ADR from docs/templates/adr.md that supersedes it, and change only this one\'s Status line to "superseded by NNNN".',
		);
	}
}

function guardPinnedTest(file, pkg, payload) {
	if (!existsSync(file)) return;
	const current = readFileSync(file, 'utf8');
	const pinned = pinnedBlocks(current).filter((b) => b.title);
	if (pinned.length === 0) return;

	const lines = current.split('\n');
	const offsets = [];
	let at = 0;
	for (const l of lines) {
		offsets.push(at);
		at += l.length + 1;
	}
	const range = (b) => [offsets[b.start], offsets[b.end] + lines[b.end].length];

	const touched = [];
	if (payload.tool_name === 'Write') {
		const next = normalizeBlock(payload.tool_input.content ?? '');
		for (const b of pinned) if (!next.includes(b.body)) touched.push(b);
	} else {
		// Every occurrence counts: a replace-all edit, or an ambiguous one, may land on any of them.
		for (const e of edits(payload.tool_input)) {
			if (!e.old_string || normalizeBlock(e.old_string) === normalizeBlock(e.new_string)) continue;
			for (let index = current.indexOf(e.old_string); index !== -1; index = current.indexOf(e.old_string, index + 1)) {
				const end = index + e.old_string.length;
				for (const b of pinned) {
					const [s, f] = range(b);
					if (index < f && end > s && !touched.includes(b)) touched.push(b);
				}
			}
		}
	}
	if (touched.length === 0) return;

	const b = touched[0];
	const slug = path.basename(b.path, '.md');
	block(
		`"${b.title}" pins ${slug} ${b.anchor.split('-')[0].toUpperCase()} (${b.path}#${b.anchor}). ` +
			'A fix makes this test pass without changing it: the only allowed edits are removing ".skip" and the "// Known defect:" comment, ' +
			'in the same change that deletes the D entry from the spec. If the test itself is wrong, stop and tell the engineer; ' +
			'a person changes it and records "Pinned-test-change: ' +
			`${slug} ${b.anchor.split('-')[0].toUpperCase()}" in the commit.`,
	);
}

function main() {
	const payload = readStdin();
	if (!payload || !['Edit', 'MultiEdit', 'Write'].includes(payload.tool_name)) return;
	const raw = payload.tool_input?.file_path;
	if (!raw) return;
	const file = path.resolve(payload.cwd ?? process.cwd(), raw);
	const pkg = packageOf(file);
	if (!pkg) return;
	guardAdr(file, pkg, payload);
	guardPinnedTest(file, pkg, payload);
}

try {
	main();
} catch {
	// Fail open; sdlc:check enforces the same rules.
}
process.exit(0);
