import parseDiff from 'parse-diff';
import type { Change } from 'parse-diff';
import type { TodoItem } from './types';

const KEYWORD = 'TODO';
const EXCLUDE_PATTERN = /(^|\/)node_modules\//;
const DEFAULT_LABEL = 'todo';

function extractLabels(title: string): { cleaned: string; labels: string[] } {
	const labels: string[] = [];
	const tagRegex = /\[([^\]]+)\]$/;
	let match = title.match(tagRegex);

	while (match) {
		labels.push(match[1].trim());
		title = title.replace(tagRegex, '').trimEnd();
		match = title.match(tagRegex);
	}

	return { cleaned: title, labels };
}

function extractBody(changes: Change[], startIndex: number, prefix: string): string | false {
	const bodyLines: string[] = [];
	const normalizedPrefix = prefix.replace(/\s+$/, '');
	const startType = changes[startIndex].type;

	for (let j = startIndex + 1; j < changes.length; j++) {
		const next = changes[j];
		if (next.type !== startType) break;

		const content = next.content.slice(1);
		if (!content.startsWith(normalizedPrefix) && !content.trimStart().startsWith(normalizedPrefix.trim())) break;

		const lineText = content.slice(normalizedPrefix.length).trim();
		if (!lineText) break;

		bodyLines.push(lineText);
	}

	return bodyLines.length ? bodyLines.join('\n') : false;
}

export function extractTodos(diffText: string): TodoItem[] {
	const files = parseDiff(diffText);
	const todos: TodoItem[] = [];
	const regex = new RegExp(`^(?<prefix>\\s*\\W+\\s*)${KEYWORD}\\b\\s*:?\\s*(?<title>.+)`, 'i');

	for (const file of files) {
		const filename = file.to ?? file.from ?? '';
		if (!filename || filename === '/dev/null' || EXCLUDE_PATTERN.test(filename)) continue;

		for (const chunk of file.chunks) {
			for (let i = 0; i < chunk.changes.length; i++) {
				const change = chunk.changes[i];
				if (change.type === 'normal') continue;

				const raw = change.content.slice(1);
				const match = regex.exec(raw);
				if (!match?.groups) continue;

				let title = match.groups.title.trim();
				if (!title) continue;

				const prefix = match.groups.prefix;
				const body = extractBody(chunk.changes, i, prefix);

				const { cleaned, labels } = extractLabels(title);
				title = cleaned;

				if (title.length > 256) {
					title = title.slice(0, 100) + '...';
				}

				const line = change.type === 'add' ? (change as { ln: number }).ln : (change as { ln: number }).ln;

				todos.push({
					type: change.type === 'add' ? 'add' : 'del',
					title,
					body,
					filename,
					line,
					labels: labels.length ? labels : [DEFAULT_LABEL],
				});
			}
		}
	}

	return todos;
}
