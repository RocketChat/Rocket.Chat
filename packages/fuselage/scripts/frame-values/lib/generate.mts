import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { fontReferenceProblems, moduleProblems, transformProblems } from './check.mts';
import { formatSource } from './format.mts';
import { END, START } from './markers.mts';
import type { Target } from './target.mts';
import { unresolvedReferences } from './tokens.mts';

/** The targets of every generator module directly in a directory, and what those modules state that a frame cannot hold. */
export const loadModules = async (directory: string) => {
	const names = readdirSync(directory).filter((name) => name.endsWith('.mts'));

	return {
		problems: names.flatMap((name) => moduleProblems(name, readFileSync(join(directory, name), 'utf8'))),
		targets: (
			await Promise.all(names.map(async (name) => (await import(pathToFileURL(join(directory, name)).href)).default as Target[]))
		).flat(),
	};
};

/**
 * Writes the generated section of each target and returns what is wrong with them. With `check` nothing is written, and
 * a stale section is one of the problems. A section that names a token or theme key the Tamagui config lacks, or a
 * token in a font property, is never written.
 */
export const generateFrameValues = async (targets: Target[], check: boolean) => {
	const problems: string[] = [];

	for (const { file, generate } of targets) {
		const source = readFileSync(file, 'utf8');
		const start = source.indexOf(START);
		const end = start === -1 ? -1 : source.indexOf(END, start + START.length);

		if (start === -1 || end === -1) {
			problems.push(`${file} has no generated section: add the \`${START}\` and \`${END}\` markers`);
			continue;
		}

		const body = await formatSource(file, generate());
		const fontProblems = fontReferenceProblems(file, body);
		if (fontProblems.length) {
			problems.push(...fontProblems);
			continue;
		}
		const unresolved = unresolvedReferences(body);
		if (unresolved.length) {
			problems.push(`${file}: the Tamagui config has no token or theme key for ${unresolved.join(', ')}`);
			continue;
		}
		problems.push(...transformProblems(file, body));

		const next = `${source.slice(0, start)}${START}\n\n${body}\n${source.slice(end)}`;
		if (next === source) {
			continue;
		}
		if (check) {
			problems.push(`${file} is out of date: run \`yarn generate:frame-values\``);
		} else {
			writeFileSync(file, next);
		}
	}

	return problems;
};
