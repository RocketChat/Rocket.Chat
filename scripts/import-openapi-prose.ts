#!/usr/bin/env bun
/**
 * Imports the prose (summary, description, request and response examples) of the hand-written
 * definitions in https://github.com/RocketChat/Rocket.Chat-Open-API into the route options of our
 * typed endpoints, matching operations by method and path.
 *
 * Types are NOT imported: the schemas in this repository are the source of truth and are validated
 * at runtime, while the ones in the definitions repository are hand-maintained and looser.
 *
 * Usage:
 *   bun scripts/import-openapi-prose.ts --spec ../Rocket.Chat-Open-API apps/meteor/server/api/v1/channels.ts
 *   bun scripts/import-openapi-prose.ts --spec ../Rocket.Chat-Open-API --dry-run apps/meteor/server/api/v1/*.ts
 *
 * Examples land in a sibling `<file>.examples.ts` module so the endpoint definitions stay readable.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

type Example = { summary?: string; description?: string; value: unknown };
type Examples = { body?: Record<string, Example>; response?: Record<number, Record<string, Example>> };
type Operation = {
	summary?: string;
	description?: string;
	tags?: string[];
	responses?: Record<string, { content?: Record<string, { examples?: Record<string, Example> }> }>;
	requestBody?: { content?: Record<string, { examples?: Record<string, Example> }> };
};

const args = process.argv.slice(2);
const specIndex = args.indexOf('--spec');
const dryRun = args.includes('--dry-run');
const specPath = specIndex === -1 ? undefined : args[specIndex + 1];
const targets = args.filter((arg, index) => !arg.startsWith('--') && index !== specIndex + 1);

if (!specPath || !targets.length) {
	console.error('usage: bun scripts/import-openapi-prose.ts --spec <path to Rocket.Chat-Open-API> <file.ts...>');
	process.exit(1);
}

const { parse } = await import('yaml').catch(() => {
	console.error('this script needs the `yaml` package available in node_modules');
	return process.exit(1);
});

/** `/api/v1/rooms/:rid` and `/api/v1/rooms/{rid}` are the same operation. */
const normalizePath = (path: string): string =>
	path
		.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
		.replace(/\/{2,}/g, '/')
		.replace(/\/$/, '');

const loadOperations = (): Map<string, Operation> => {
	const operations = new Map<string, Operation>();
	const files = readdirSync(specPath).filter((file) => file.endsWith('.yaml'));

	for (const file of files) {
		const document = parse(readFileSync(join(specPath, file), 'utf8')) as { paths?: Record<string, Record<string, Operation>> };

		for (const [path, methods] of Object.entries(document.paths ?? {})) {
			for (const [method, operation] of Object.entries(methods)) {
				operations.set(`${method} ${normalizePath(path)}`, operation);
			}
		}
	}

	return operations;
};

/** Index of the closing brace matching the `{` at `start`, skipping strings, template literals and comments. */
const findClosingBrace = (source: string, start: number): number => {
	let depth = 0;

	for (let index = start; index < source.length; index++) {
		const char = source[index];

		if (char === '\\') {
			index++;
			continue;
		}

		if (char === "'" || char === '"' || char === '`') {
			const quote = char;
			index++;
			while (index < source.length && source[index] !== quote) {
				index += source[index] === '\\' ? 2 : 1;
			}
			continue;
		}

		if (char === '/' && source[index + 1] === '/') {
			index = source.indexOf('\n', index);
			continue;
		}

		if (char === '/' && source[index + 1] === '*') {
			index = source.indexOf('*/', index) + 1;
			continue;
		}

		if (char === '{') {
			depth++;
		}

		if (char === '}') {
			depth--;
			if (depth === 0) {
				return index;
			}
		}
	}

	throw new Error('unbalanced braces');
};

const quoted = (value: string): string => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** `dot-notation` rejects `examples['me']`, while `examples['channels.info']` has no alternative. */
const propertyAccess = (object: string, key: string): string =>
	/^[A-Za-z_$][\w$]*$/.test(key) ? `${object}.${key}` : `${object}[${quoted(key)}]`;

const templateLiteral = (value: string): string =>
	`\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${').trimEnd()}\``;

const collectExamples = (operation: Operation, declaredStatuses: number[], hasBody: boolean): Examples | undefined => {
	const examples: Examples = {};

	for (const [status, response] of Object.entries(operation.responses ?? {})) {
		const code = Number(status);
		if (!declaredStatuses.includes(code)) {
			continue;
		}
		const named = Object.values(response.content ?? {})[0]?.examples;
		if (named && Object.keys(named).length) {
			examples.response = { ...examples.response, [code]: named };
		}
	}

	if (hasBody) {
		const named = Object.values(operation.requestBody?.content ?? {})[0]?.examples;
		if (named && Object.keys(named).length) {
			examples.body = named;
		}
	}

	return Object.keys(examples).length ? examples : undefined;
};

/**
 * Inserts the examples import where `import-x/order` wants it: sibling imports come before parent
 * ones and are sorted among themselves.
 */
const withExamplesImport = (source: string, name: string, path: string): string => {
	const statement = `import { ${name} } from '${path}';`;
	const imports = [...source.matchAll(/^import[\s\S]*?from '([^']+)';$/gm)];
	const sibling = imports.filter(([, from]) => from.startsWith('./'));
	const parent = imports.filter(([, from]) => from.startsWith('../'));

	const before = sibling.find(([, from]) => from > path) ?? parent[0];

	if (before) {
		return `${source.slice(0, before.index)}${statement}\n${source.slice(before.index)}`;
	}

	const after = sibling[sibling.length - 1] ?? imports[imports.length - 1];
	const at = after ? after.index + after[0].length : 0;

	return `${source.slice(0, at)}\n${statement}${source.slice(at)}`;
};

const operations = loadOperations();
// `.get('x', {` rather than `API.v1.get('x', {`: registrations are often chained
const callSite = /\.(get|post|put|delete)\(\s*'([^']+)',\s*\n?\s*\{/g;

/** Tells a route registration from any other two argument call that happens to take an object. */
const isRouteOptions = (options: string): boolean => /^\s*(response|authRequired|query|body|permissionsRequired|tags):/m.test(options);

/** Indentation of the line the options object opens on. */
const indentationOf = (source: string, at: number): string =>
	/^[\t ]*/.exec(source.slice(source.lastIndexOf('\n', at) + 1, at))?.[0] ?? '\t';

for (const target of targets) {
	const source = readFileSync(target, 'utf8');
	const moduleName = basename(target, '.ts') === 'index' ? basename(dirname(target)) : basename(target, '.ts');
	const exampleName = `${moduleName.replace(/[^A-Za-z0-9]+(.)/g, (_, char: string) => char.toUpperCase())}Examples`;
	const collectedExamples: Record<string, Examples> = {};
	const edits: { start: number; end: number; text: string }[] = [];
	let imported = 0;
	let skipped = 0;

	for (const match of source.matchAll(callSite)) {
		const [, method, subpath] = match;
		const openBrace = match.index + match[0].length - 1;
		const bodyIndent = `${indentationOf(source, openBrace)}\t`;
		const closeBrace = findClosingBrace(source, openBrace);
		const options = source.slice(openBrace, closeBrace + 1);

		if (!isRouteOptions(options) || /^\s*summary:/m.test(options)) {
			continue;
		}

		const operation = operations.get(`${method} ${normalizePath(`/api/v1/${subpath}`)}`);

		if (!operation?.summary && !operation?.description) {
			skipped++;
			continue;
		}

		const declaredStatuses = [...options.matchAll(/^\s*(\d{3}):/gm)].map(([, code]) => Number(code));
		const examples = collectExamples(operation, declaredStatuses, /^\s*body:/m.test(options));
		const lines: string[] = [];

		if (operation.summary) {
			lines.push(`${bodyIndent}summary: ${quoted(operation.summary)},`);
		}
		if (operation.description) {
			lines.push(`${bodyIndent}description: ${templateLiteral(operation.description)},`);
		}
		if (examples) {
			collectedExamples[subpath] = examples;
			lines.push(`${bodyIndent}examples: ${propertyAccess(exampleName, subpath)},`);
		}

		// the tags are the grouping of the published documentation, so they win over ours
		const tags = operation.tags?.length ? `[${operation.tags.map(quoted).join(', ')}]` : undefined;
		const existingTags = /^(\s*)tags:\s*\[[^\]]*\],$/m.exec(options);

		if (tags && !existingTags) {
			lines.push(`${bodyIndent}tags: ${tags},`);
		}

		let patchedOptions = `{\n${lines.join('\n')}${options.slice(1)}`;

		if (tags && existingTags) {
			patchedOptions = patchedOptions.replace(existingTags[0], `${existingTags[1]}tags: ${tags},`);
		}

		edits.push({ start: openBrace, end: closeBrace + 1, text: patchedOptions });
		imported++;
	}

	if (dryRun) {
		console.log(`${target}: would import ${imported}, no match for ${skipped}`);
		continue;
	}

	let patched = source;
	for (const { start, end, text } of edits.reverse()) {
		patched = patched.slice(0, start) + text + patched.slice(end);
	}

	const examplesPath = join(dirname(target), `${basename(target, '.ts')}.examples.ts`);

	if (Object.keys(collectedExamples).length) {
		if (!patched.includes(`from './${basename(examplesPath, '.ts')}'`)) {
			patched = withExamplesImport(patched, exampleName, `./${basename(examplesPath, '.ts')}`);
		}

		writeFileSync(
			examplesPath,
			[
				`import type { OpenAPIDocumentation } from '@rocket.chat/http-router';`,
				'',
				`/**`,
				` * Request and response examples for the ${basename(target, '.ts')} endpoints, imported from`,
				` * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.`,
				` */`,
				`export const ${exampleName} = ${JSON.stringify(collectedExamples, null, '\t')} satisfies Record<`,
				`\tstring,`,
				`\tNonNullable<OpenAPIDocumentation['examples']>`,
				`>;`,
				'',
			].join('\n'),
		);
	} else if (existsSync(examplesPath)) {
		console.warn(`${examplesPath} exists but no examples were collected`);
	}

	writeFileSync(target, patched);
	console.log(`${target}: imported ${imported}, no match for ${skipped}`);
}
