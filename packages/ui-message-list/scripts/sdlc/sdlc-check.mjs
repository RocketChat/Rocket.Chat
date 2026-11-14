#!/usr/bin/env node
// Holds a spec-first package's intents, specs, plans, ADRs and tests to the rules in its
// docs/README.md, so that what the documents promise and what the tests prove cannot drift
// apart unnoticed. Runs with plain Node, no dependencies, for any agent, engineer or CI job.
//
// Usage (from the package, through its sdlc:check script):
//   node scripts/sdlc/sdlc-check.mjs . [--base <git-ref>]
//
// --base compares against a git ref (the PR base) to enforce the rules that only show in a
// diff: merged ADRs are never edited, R and Q ids are never removed, and a test that pins a
// known defect only loses its skip, in the same change that deletes the D entry.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const SPEC_STATUSES = new Set(['draft', 'planned', 'implemented', 'partial', 'not-planned', 'deprecated']);
const INTENT_STATUSES = new Set(['draft', 'accepted', 'rejected']);
const PLAN_STATUSES = new Set(['approved', 'done', 'abandoned']);
const REQUIRED_TEMPLATES = ['intent.md', 'spec.md', 'plan.md', 'adr.md'];
const PLACEHOLDER_FILES = ['AGENTS.md', 'CLAUDE.md', 'REVIEW.md', 'docs/README.md', 'evals/README.md', 'scripts/sdlc/README.md'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.turbo', '.git', 'docs', 'evals']);
const TEST_FILE = /\.(spec|test)\.[cm]?[jt]sx?$/;
const MARKER = 'docs/templates/spec.md';

const findings = [];
const report = (level, file, line, message) => findings.push({ level, file, line, message });
const error = (file, line, message) => report('error', file, line, message);
const warn = (file, line, message) => report('warning', file, line, message);

function main() {
	const args = process.argv.slice(2);
	let base;
	const dirs = [];
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--base') base = args[++i];
		else if (args[i] === '--help' || args[i] === '-h') return usage(0);
		else dirs.push(args[i]);
	}
	if (dirs.length === 0) return usage(2);

	for (const dir of dirs) checkPackage(path.resolve(dir), base);
	return print();
}

function usage(code) {
	console.log('usage: sdlc-check.mjs <package-dir>... [--base <git-ref>]');
	process.exit(code);
}

function git(args, cwd) {
	try {
		return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------- parsing

function read(file) {
	try {
		return readFileSync(file, 'utf8');
	} catch {
		return null;
	}
}

function listMarkdown(dir) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith('.md') && f !== 'README.md')
		.sort()
		.map((f) => path.join(dir, f));
}

// GitHub's heading anchors: lowercase, punctuation dropped, each space a hyphen.
export function slugify(heading) {
	return heading
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s_-]/gu, '')
		.replace(/\s/g, '-');
}

function lineOf(text, index) {
	return text.slice(0, index).split('\n').length;
}

export function parseFrontmatter(text) {
	if (!text.startsWith('---\n')) return null;
	const end = text.indexOf('\n---', 4);
	if (end === -1) return null;
	const data = {};
	let listKey = null;
	// Formatters wrap long flow lists over several lines; fold each back onto its key's line.
	const folded = [];
	let open = false;
	for (const raw of text.slice(4, end).split('\n')) {
		const line = raw.replace(/\s+#.*$/, '');
		if (open) folded[folded.length - 1] += ` ${line.trim()}`;
		else if (/^\s+\[/.test(line) && folded.length && /:\s*$/.test(folded[folded.length - 1]))
			folded[folded.length - 1] += ` ${line.trim()}`;
		else folded.push(line);
		const last = folded[folded.length - 1];
		open = last.includes('[') && !last.includes(']');
	}
	for (const line of folded) {
		const item = line.match(/^\s+-\s+(.*)$/);
		if (item && listKey) {
			data[listKey].push(unquote(item[1]));
			continue;
		}
		const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
		if (!kv) continue;
		const [, key, value] = kv;
		listKey = null;
		if (value === '') {
			data[key] = [];
			listKey = key;
		} else if (value.startsWith('[')) {
			data[key] = value
				.replace(/^\[|\]\s*$/g, '')
				.split(',')
				.map((v) => unquote(v.trim()))
				.filter(Boolean);
		} else {
			data[key] = unquote(value.trim());
		}
	}
	return data;
}

function unquote(v) {
	return v.replace(/^['"]|['"]$/g, '');
}

function ids(text, letter) {
	const found = new Map();
	const dupes = [];
	for (const m of text.matchAll(new RegExp(`\\*\\*${letter}(\\d+)\\*\\*`, 'g'))) {
		const n = Number(m[1]);
		if (found.has(n)) dupes.push({ n, line: lineOf(text, m.index) });
		else found.set(n, lineOf(text, m.index));
	}
	return { found, dupes };
}

function defects(text) {
	const out = new Map();
	const dupes = [];
	for (const m of text.matchAll(/^###\s+(D(\d+)\b.*)$/gm)) {
		const n = Number(m[2]);
		const entry = { n, anchor: slugify(m[1]), line: lineOf(text, m.index) };
		if ([...out.values()].some((d) => d.n === n)) dupes.push(entry);
		else out.set(entry.anchor, entry);
	}
	return { byAnchor: out, numbers: new Set([...out.values()].map((d) => d.n)), dupes };
}

function statusLine(text) {
	return text
		.split('\n')
		.slice(0, 12)
		.join('\n')
		.match(/Status:\**\s*([A-Za-z-]+(?: by \d{4})?)/)?.[1];
}

// A test pinned to a known defect: the `// Known defect:` comment, any comments under it, and
// the skipped test that follows, up to its closing line at the same indentation.
export function pinnedBlocks(text) {
	const lines = text.split('\n');
	const blocks = [];
	for (let i = 0; i < lines.length; i++) {
		const ref = lines[i].match(/\/\/\s*Known defect:\s*(\S+?)#(\S+)/);
		if (!ref) continue;
		let j = i + 1;
		while (j < lines.length && (lines[j].trim() === '' || lines[j].trim().startsWith('//'))) j++;
		const start = lines[j]?.match(/^(\s*)(?:it|test|describe)(\.skip)?\s*\(/);
		if (!start) {
			blocks.push({ path: ref[1], anchor: ref[2], line: i + 1, title: null, skipped: false, start: i, end: i, body: '' });
			continue;
		}
		const end = blockEnd(lines, j, start[1]);
		blocks.push({
			path: ref[1],
			anchor: ref[2],
			line: i + 1,
			title: titleAt(lines, j),
			skipped: Boolean(start[2]),
			start: i,
			end,
			body: normalizeBlock(lines.slice(j, end + 1).join('\n')),
		});
	}
	return blocks;
}

function blockEnd(lines, j, indent) {
	if (/\)\s*;?\s*$/.test(lines[j]) && balanced(lines[j])) return j;
	for (let k = j + 1; k < lines.length; k++) {
		if (lines[k].startsWith(`${indent}}`) || lines[k].startsWith(`${indent})`)) return k;
	}
	return j;
}

function balanced(line) {
	let depth = 0;
	for (const c of line) {
		if (c === '(') depth++;
		if (c === ')') depth--;
	}
	return depth === 0;
}

function titleAt(lines, j) {
	const text = `${lines[j]}\n${lines[j + 1] ?? ''}`;
	return text.match(/\(\s*(['"`])((?:\\.|(?!\1).)*)\1/s)?.[2] ?? null;
}

export function normalizeBlock(body) {
	return body
		.split('\n')
		.filter((l) => !/\/\/\s*Known defect:/.test(l))
		.map((l) => l.replace(/\b(it|test|describe)\.skip\s*\(/, '$1(').trimEnd())
		.join('\n');
}

// A test written anywhere in the file whose title matches, skipped or not.
export function findTest(text, title) {
	const lines = text.split('\n');
	for (let j = 0; j < lines.length; j++) {
		const start = lines[j].match(/^(\s*)(?:it|test|describe)(\.skip)?\s*\(/);
		if (!start || titleAt(lines, j) !== title) continue;
		const end = blockEnd(lines, j, start[1]);
		return { skipped: Boolean(start[2]), body: normalizeBlock(lines.slice(j, end + 1).join('\n')) };
	}
	return null;
}

// ---------------------------------------------------------------------------- package

function checkPackage(pkg, base) {
	const rel = (f) => path.relative(process.cwd(), f) || '.';
	if (!existsSync(path.join(pkg, MARKER))) {
		error(rel(pkg), 0, `not a spec-first package: ${MARKER} is missing (run the sdlc-setup skill)`);
		return;
	}

	for (const t of REQUIRED_TEMPLATES) {
		if (!existsSync(path.join(pkg, 'docs/templates', t))) error(rel(path.join(pkg, 'docs/templates')), 0, `missing template ${t}`);
	}
	if (!existsSync(path.join(pkg, 'docs/README.md'))) error(rel(pkg), 0, 'missing docs/README.md, the process this package follows');
	if (!existsSync(path.join(pkg, 'AGENTS.md')) && !existsSync(path.join(pkg, 'CLAUDE.md'))) {
		warn(rel(pkg), 0, 'no AGENTS.md: agents opening this package will not learn its rules');
	}
	for (const f of PLACEHOLDER_FILES) {
		const text = read(path.join(pkg, f));
		if (!text) continue;
		for (const m of text.matchAll(/\{\{[A-Z0-9_]+\}\}|<!--\s*sdlc-setup:/g)) {
			error(rel(path.join(pkg, f)), lineOf(text, m.index), `unfilled setup placeholder ${m[0]}`);
		}
	}

	const adrDir = path.join(pkg, 'docs/adr');
	const adrNumbers = new Map();
	for (const file of listMarkdown(adrDir)) {
		const name = path.basename(file);
		const num = name.match(/^(\d{4})-[a-z0-9-]+\.md$/)?.[1];
		if (!num) {
			error(rel(file), 0, 'ADR file name must be NNNN-<slug>.md');
			continue;
		}
		if (adrNumbers.has(num)) error(rel(file), 0, `ADR number ${num} is used twice`);
		adrNumbers.set(num, file);
		const status = statusLine(read(file))?.toLowerCase();
		if (!status || !(status === 'accepted' || /^superseded by \d{4}$/.test(status))) {
			error(rel(file), 0, `ADR status must be "accepted" or "superseded by NNNN", found "${status ?? 'none'}"`);
		}
	}

	const specs = new Map();
	for (const file of listMarkdown(path.join(pkg, 'docs/specs'))) {
		const text = read(file);
		const slug = path.basename(file, '.md');
		const fm = parseFrontmatter(text);
		const r = ids(text, 'R');
		const q = ids(text, 'Q');
		const d = defects(text);
		specs.set(slug, { file, text, fm, r, q, d });
		if (!fm) {
			error(rel(file), 1, 'spec has no frontmatter');
			continue;
		}
		if (!SPEC_STATUSES.has(fm.status)) error(rel(file), 2, `unknown spec status "${fm.status}"`);
		for (const key of ['adrs', 'code', 'tests']) {
			if (!Array.isArray(fm[key])) error(rel(file), 1, `frontmatter needs a "${key}" list, even an empty one`);
		}
		for (const key of ['code', 'tests']) {
			for (const p of fm[key] ?? []) {
				if (!p.includes('*') && !resolveListed(pkg, p))
					error(rel(file), 1, `${key} lists ${p}, which exists neither in the package nor at the repository root`);
			}
		}
		for (const a of fm.adrs ?? []) {
			if (!adrNumbers.has(String(a).padStart(4, '0'))) error(rel(file), 1, `adrs lists ${a}, which has no file in docs/adr/`);
		}
		if ((fm.status === 'implemented' || fm.status === 'partial') && !(fm.code?.length && fm.tests?.length)) {
			warn(rel(file), 1, `status is ${fm.status} but code or tests is empty`);
		}
		for (const { n, line } of r.dupes) error(rel(file), line, `R${n} is used twice; ids are never reused`);
		for (const { n, line } of q.dupes) error(rel(file), line, `Q${n} is used twice; ids are never reused`);
		for (const { n, line } of d.dupes) error(rel(file), line, `D${n} is used twice; ids are never reused`);
	}

	const intents = new Map();
	for (const file of listMarkdown(path.join(pkg, 'docs/intents'))) {
		const text = read(file);
		intents.set(path.basename(file, '.md'), { file, text, q: ids(text, 'Q') });
		const status = statusLine(text);
		if (!INTENT_STATUSES.has(status)) error(rel(file), 0, `intent status must be draft, accepted or rejected, found "${status ?? 'none'}"`);
		for (const { n, line } of ids(text, 'Q').dupes) error(rel(file), line, `Q${n} is used twice; ids are never reused`);
	}

	for (const file of listMarkdown(path.join(pkg, 'docs/plans'))) {
		const text = read(file);
		const status = statusLine(text);
		if (!PLAN_STATUSES.has(status)) error(rel(file), 0, `plan status must be approved, done or abandoned, found "${status ?? 'none'}"`);
		const slug = text.match(/from\s+(?:\.\.\/)?specs\/([a-z0-9-]+)\.md/)?.[1];
		const spec = slug && specs.get(slug);
		if (!spec) {
			error(rel(file), 1, 'plan title must name its spec as "(from specs/<slug>.md, YYYY-MM-DD)" and that spec must exist');
			continue;
		}
		const proof = text.split(/^## Proof\s*$/m)[1];
		if (!proof) {
			error(rel(file), 0, 'plan has no "## Proof" section');
			continue;
		}
		for (const m of proof.matchAll(/^\|\s*`?(?:([a-z0-9-]+)\s+)?([RD])(\d+)`?\s*\|/gm)) {
			const target = m[1] ? specs.get(m[1]) : spec;
			const line = lineOf(text, text.indexOf(proof) + m.index);
			if (!target) error(rel(file), line, `Proof row cites spec ${m[1]}, which does not exist`);
			else if (m[2] === 'R' && !target.r.found.has(Number(m[3])))
				error(rel(file), line, `Proof row cites R${m[3]}, which ${m[1] ?? slug} does not have`);
			else if (m[2] === 'D' && status === 'approved' && !target.d.numbers.has(Number(m[3]))) {
				error(rel(file), line, `Proof row cites D${m[3]}, which ${m[1] ?? slug} does not have`);
			}
		}
	}

	checkTests(pkg, specs, rel);
	if (base) checkAgainstBase(pkg, base, specs, intents, rel);
}

// Spec frontmatter lists paths relative to the package, or to the repository root for code the
// package reaches into elsewhere (a Meteor hook, a client modal).
let repoRoot;
function resolveListed(pkg, p) {
	repoRoot ??= git(['rev-parse', '--show-toplevel'], pkg)?.trim() ?? null;
	const candidates = [path.join(pkg, p), repoRoot && path.join(repoRoot, p)].filter(Boolean);
	return candidates.find((c) => existsSync(c)) ?? null;
}

function testFiles(pkg, specs) {
	const out = new Set();
	const walk = (dir) => {
		for (const entry of readdirSync(dir)) {
			if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;
			const full = path.join(dir, entry);
			const st = statSync(full);
			if (st.isDirectory()) walk(full);
			else if (TEST_FILE.test(entry)) out.add(full);
		}
	};
	walk(pkg);
	for (const { fm } of specs.values()) {
		for (const t of fm?.tests ?? []) {
			const full = resolveListed(pkg, t);
			if (full && statSync(full).isFile()) out.add(full);
		}
	}
	return [...out].sort();
}

function checkTests(pkg, specs, rel) {
	const pinned = new Set();
	const specsListing = new Map();
	for (const [slug, s] of specs) {
		for (const t of s.fm?.tests ?? []) {
			const key = resolveListed(pkg, t);
			if (key) specsListing.set(key, [...(specsListing.get(key) ?? []), slug]);
		}
	}

	for (const file of testFiles(pkg, specs)) {
		const text = read(file);
		for (const b of pinnedBlocks(text)) {
			const specFile = path.resolve(path.dirname(file), b.path);
			const slug = path.basename(specFile, '.md');
			const spec = specs.get(slug);
			if (!spec || path.dirname(specFile) !== path.join(pkg, 'docs/specs')) {
				error(rel(file), b.line, `Known defect link points at ${b.path}, which is not a spec in this package`);
				continue;
			}
			if (!spec.d.byAnchor.has(b.anchor)) {
				error(rel(file), b.line, `Known defect link #${b.anchor} matches no "### D<n>" heading in ${slug}`);
				continue;
			}
			pinned.add(`${slug}#${b.anchor}`);
			if (!b.title) warn(rel(file), b.line, 'Known defect comment is not followed by a test');
			else if (!b.skipped)
				error(
					rel(file),
					b.line,
					`the test pinning ${slug} ${b.anchor.split('-')[0].toUpperCase()} runs; a fixed defect deletes its D entry and this comment`,
				);
		}

		const lines = text.split('\n');
		lines.forEach((line, i) => {
			for (const m of line.matchAll(/\((?:([a-z][a-z0-9-]*) )?((?:[RD]\d+)(?:,\s*[RD]\d+)*)\)['"`]/g)) {
				const cited = m[2].split(/,\s*/);
				const owners = m[1] ? [m[1]] : (specsListing.get(file) ?? []);
				if (m[1] && !specs.has(m[1])) {
					error(rel(file), i + 1, `test cites spec "${m[1]}", which does not exist`);
					continue;
				}
				if (owners.length === 0) {
					warn(rel(file), i + 1, `test cites ${m[2]} but no spec lists this file under tests, so the ids cannot be resolved`);
					continue;
				}
				for (const id of cited) {
					const n = Number(id.slice(1));
					const has = owners.some((o) => (id[0] === 'R' ? specs.get(o)?.r.found.has(n) : specs.get(o)?.d.numbers.has(n)));
					if (has) continue;
					if (id[0] === 'R') error(rel(file), i + 1, `test cites ${id}, which ${owners.join(' / ')} does not have`);
					else
						warn(
							rel(file),
							i + 1,
							`test cites ${id}, which ${owners.join(' / ')} no longer lists; drop it from the title once the defect is fixed`,
						);
				}
			}
		});
	}

	for (const [slug, s] of specs) {
		for (const d of s.d.byAnchor.values()) {
			if (!pinned.has(`${slug}#${d.anchor}`)) {
				error(rel(s.file), d.line, `D${d.n} has no skipped test with "// Known defect: <path>/${slug}.md#${d.anchor}" above it`);
			}
		}
	}
}

// ---------------------------------------------------------------------------- against a base ref

function checkAgainstBase(pkg, base, specs, intents, rel) {
	const root = git(['rev-parse', '--show-toplevel'], pkg)?.trim();
	if (!root) return error(rel(pkg), 0, '--base needs a git checkout');
	if (git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`], root) === null) {
		return error(rel(pkg), 0, `--base ${base} is not a commit here; fetch it first`);
	}
	const pkgRel = path.relative(root, pkg).split(path.sep).join('/');
	const atBase = (p) => git(['show', `${base}:${pkgRel ? `${pkgRel}/` : ''}${p}`], root);
	const listAtBase = (dir) =>
		(git(['ls-tree', '--name-only', `${base}:${pkgRel ? `${pkgRel}/` : ''}${dir}`], root) ?? '')
			.split('\n')
			.filter((f) => f.endsWith('.md') && f !== 'README.md');

	for (const name of listAtBase('docs/adr')) {
		const before = atBase(`docs/adr/${name}`);
		const after = read(path.join(pkg, 'docs/adr', name));
		const file = rel(path.join(pkg, 'docs/adr', name));
		if (after === null) {
			error(file, 0, 'a merged ADR was deleted; supersede it with a new ADR instead');
			continue;
		}
		const strip = (t) =>
			t
				.split('\n')
				.filter((l) => !/Status:/.test(l))
				.join('\n')
				.trimEnd();
		if (strip(before) !== strip(after)) {
			error(file, 0, 'a merged ADR was edited; only its Status line may change, to "superseded by NNNN"');
		}
	}

	for (const name of listAtBase('docs/specs')) {
		const slug = name.replace(/\.md$/, '');
		const now = specs.get(slug);
		const file = rel(path.join(pkg, 'docs/specs', name));
		if (!now) {
			error(file, 0, 'a spec was deleted; set its status to deprecated instead');
			continue;
		}
		const before = atBase(`docs/specs/${name}`);
		for (const n of ids(before, 'R').found.keys()) {
			if (!now.r.found.has(n)) error(file, 0, `R${n} was removed; strike its text through and keep the number`);
		}
		for (const n of ids(before, 'Q').found.keys()) {
			if (!now.q.found.has(n)) error(file, 0, `Q${n} was removed; strike it through and point at where the answer went`);
		}
	}
	for (const name of listAtBase('docs/intents')) {
		const now = intents.get(name.replace(/\.md$/, ''));
		if (!now) continue;
		for (const n of ids(atBase(`docs/intents/${name}`), 'Q').found.keys()) {
			if (!now.q.found.has(n)) error(rel(now.file), 0, `Q${n} was removed; strike it through and point at where the answer went`);
		}
	}

	const log = git(['log', '--format=%B', `${base}..HEAD`], root) ?? '';
	const allowed = new Set([...log.matchAll(/^Pinned-test-change:\s*(.+)$/gim)].map((m) => m[1].trim().toLowerCase()));
	const grep = git(['grep', '-l', 'Known defect:', base, '--', pkgRel || '.'], root) ?? '';
	for (const entry of grep.split('\n').filter(Boolean)) {
		const repoPath = entry.slice(base.length + 1);
		if (!TEST_FILE.test(repoPath)) continue;
		const abs = path.join(root, repoPath);
		const now = read(abs);
		for (const b of pinnedBlocks(git(['show', `${base}:${repoPath}`], root) ?? '')) {
			if (!b.title) continue;
			const slug = path.basename(b.path, '.md');
			const d = `D${b.anchor.match(/^d(\d+)/)?.[1]}`;
			const id = `${slug} ${d}`;
			const stillListed = specs.get(slug)?.d.byAnchor.has(b.anchor);
			const override = allowed.has(id.toLowerCase());
			const test = now && findTest(now, b.title);
			if (!test) {
				if (!override)
					error(
						rel(abs),
						b.line,
						`the test pinning ${id} ("${b.title}") was removed or renamed; add "Pinned-test-change: ${id}" to a commit if a person decided to`,
					);
				continue;
			}
			if (test.body !== b.body && !override) {
				error(
					rel(abs),
					b.line,
					`the test pinning ${id} changed beyond losing its skip; a fix makes the test pass, it does not edit it. Add "Pinned-test-change: ${id}" to a commit if a person decided to`,
				);
			}
			if (!test.skipped && stillListed)
				error(rel(abs), b.line, `the test pinning ${id} was un-skipped but the D entry is still in the spec; delete it in the same change`);
			if (test.skipped && !stillListed && specs.has(slug))
				error(rel(abs), b.line, `${id} was deleted from the spec but its test is still skipped`);
		}
	}
}

// ---------------------------------------------------------------------------- output

function print() {
	const gha = process.env.GITHUB_ACTIONS === 'true';
	const root = gha ? (git(['rev-parse', '--show-toplevel'], process.cwd())?.trim() ?? process.cwd()) : null;
	for (const f of findings) {
		const where = f.line ? `${f.file}:${f.line}` : f.file;
		console.log(`${where}: ${f.level}: ${f.message}`);
		if (gha) {
			const file = path.relative(root, path.resolve(f.file));
			console.log(`::${f.level} file=${file}${f.line ? `,line=${f.line}` : ''}::${f.message}`);
		}
	}
	const errors = findings.filter((f) => f.level === 'error').length;
	const warnings = findings.length - errors;
	console.log(errors || warnings ? `sdlc-check: ${errors} error(s), ${warnings} warning(s)` : 'sdlc-check: ok');
	process.exit(errors ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('sdlc-check.mjs')) main();
