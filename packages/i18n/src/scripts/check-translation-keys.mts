/**
 * Validates that all translation keys used via `t()` (useTranslation) or backend `t`/`i18n.t`
 * exist in the English base locale (en.i18n.json).
 *
 * Usage:
 *   node check-translation-keys.mts [--package=NAME] [--backend]
 *
 * Options:
 *   --package=NAME   Only check the given package (e.g. ui-voip). Omit to check all.
 *   --backend        Also check backend files (apps/meteor) that use utils/lib/i18n or server/lib/i18n.
 */

import type { Dirent } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { argv, exit, stderr } from 'node:process';
import { parseArgs, styleText } from 'node:util';

import { baseLanguage, readResource, rootDirectory } from './common.mts';

const REPO_ROOT = join(rootDirectory, '..', '..');

const SKIP_FILE_PATTERNS = [/\.(test|spec)\.(ts|tsx)$/i, /\.(stories|story)\.(ts|tsx)$/i];

const FRONTEND_T_REGEX = /\bt\s*\(\s*['"]([^'"]+)['"]/g;
const BACKEND_T_REGEX = /\bt\s*\(\s*['"]([^'"]+)['"]/g;
const BACKEND_I18N_T_REGEX = /\bi18n\.t\s*\(\s*['"]([^'"]+)['"]/g;

const USE_TRANSLATION_PATTERN = /useTranslation\s*[(\[]?/;
// Matches imports of t or i18n from backend i18n (utils/lib/i18n, server/lib/i18n, or relative ../i18n).
// Excludes npm imports (e.g. @rocket.chat/i18n).
const BACKEND_I18N_IMPORT_PATTERN = /from\s+['"](?![^'"]*@)[^'"]*(?:utils\/lib\/i18n|server\/lib\/i18n|(?:\.\.\/)+i18n)(?:\.ts)?['"]/;

function shouldSkipFile(path: string): boolean {
	return SKIP_FILE_PATTERNS.some((re) => re.test(path));
}

function isRelevantExtension(path: string): boolean {
	return /\.(ts|tsx)$/.test(path);
}

async function* walkDir(dir: string, baseDir: string): AsyncGenerator<string> {
	let entries: Dirent<string>[];
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const full = join(dir, entry.name);
		const relative = full.slice(baseDir.length + 1);
		if (entry?.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
			yield* walkDir(full, baseDir);
		} else if (isRelevantExtension(relative) && !shouldSkipFile(relative)) {
			yield full;
		}
	}
}

function collectFrontendSearchDirs(packageName: string | undefined): string[] {
	const packagesDir = join(REPO_ROOT, 'packages');
	const eePackagesDir = join(REPO_ROOT, 'ee', 'packages');
	if (packageName) {
		const inPackages = join(packagesDir, packageName);
		const inEe = join(eePackagesDir, packageName);
		return [inPackages, inEe].filter((d) => d);
	}
	return [packagesDir, eePackagesDir];
}

function collectBackendSearchDirs(): string[] {
	return [join(REPO_ROOT, 'apps', 'meteor')];
}

async function getFilesToScan(
	packageName: string | undefined,
	includeBackend: boolean,
): Promise<{ path: string; mode: 'frontend' | 'backend' }[]> {
	const out: { path: string; mode: 'frontend' | 'backend' }[] = [];

	const frontendDirs = collectFrontendSearchDirs(packageName);
	for (const dir of frontendDirs) {
		try {
			for await (const file of walkDir(dir, dir)) {
				out.push({ path: file, mode: 'frontend' });
			}
		} catch {
			// directory may not exist when filtering by package
		}
	}

	if (includeBackend) {
		for (const dir of collectBackendSearchDirs()) {
			try {
				for await (const file of walkDir(dir, dir)) {
					out.push({ path: file, mode: 'backend' });
				}
			} catch {
				// ignore
			}
		}
	}

	return out;
}

function extractKeysFromContent(content: string, regex: RegExp): { key: string; index: number }[] {
	const results: { key: string; index: number }[] = [];
	const re = new RegExp(regex.source, 'g');
	let m;
	while ((m = re.exec(content)) !== null) {
		results.push({ key: m[1], index: m.index });
	}
	return results;
}

function lineAndColumn(content: string, index: number): { line: number; column: number } {
	const before = content.slice(0, index);
	const line = (before.match(/\n/g) ?? []).length + 1;
	const lastNewline = before.lastIndexOf('\n');
	const column = index - lastNewline;
	return { line, column };
}

async function main(): Promise<void> {
	const { values } = parseArgs({
		args: argv.slice(2),
		options: {
			package: { type: 'string', short: 'p' },
			backend: { type: 'boolean', short: 'b', default: false },
		},
	});

	const packageName = values.package;
	const includeBackend = values.backend ?? false;

	const validKeys = new Set<string>(Object.keys(await readResource(baseLanguage)));
	const files = await getFilesToScan(packageName, includeBackend);

	let errorCount = 0;
	// const stderrSupportsColor = styleText('blue', '.', { stream: stderr }) !== '.';

	const report = (file: string, line: number, key: string) => {
		const rel = file.startsWith(REPO_ROOT) ? file.slice(REPO_ROOT.length + 1) : file;
		console.error(
			styleText('red', '✘', { stream: stderr }),
			styleText('gray', `${rel}:${line}`, { stream: stderr }),
			'Missing translation key:',
			styleText('yellow', key, { stream: stderr }),
		);
		errorCount++;
	};

	for (const { path: filePath, mode } of files) {
		const content = await readFile(filePath, 'utf8');

		if (mode === 'frontend') {
			if (!USE_TRANSLATION_PATTERN.test(content)) continue;
			const matches = extractKeysFromContent(content, FRONTEND_T_REGEX);
			for (const { key, index } of matches) {
				if (!validKeys.has(key)) {
					const { line } = lineAndColumn(content, index);
					report(filePath, line, key);
				}
			}
			continue;
		}

		if (mode === 'backend') {
			if (!BACKEND_I18N_IMPORT_PATTERN.test(content)) continue;
			const tMatches = extractKeysFromContent(content, BACKEND_T_REGEX);
			const i18nMatches = extractKeysFromContent(content, BACKEND_I18N_T_REGEX);
			const seen = new Set<number>();
			for (const { key, index } of [...tMatches, ...i18nMatches]) {
				if (seen.has(index)) continue;
				seen.add(index);
				if (!validKeys.has(key)) {
					const { line } = lineAndColumn(content, index);
					report(filePath, line, key);
				}
			}
		}
	}

	if (errorCount > 0) {
		console.error(styleText('red', `\n${errorCount} missing translation key(s) found.`, { stream: stderr }));
		exit(1);
	}

	console.log(styleText('green', 'All translation keys are valid.'));
}

main().catch((err) => {
	console.error(err);
	exit(1);
});
