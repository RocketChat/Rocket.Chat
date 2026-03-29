import parseDiff from 'parse-diff';
import type { Change } from 'parse-diff';
import type { TodoItem } from './types';

const KEYWORD = 'TODO';
const EXCLUDE_PATTERN = /(^|\/)node_modules\//;
const DEFAULT_LABEL = 'todo';

const MENTION_REGEX = /\B@([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})/g;

function extractMentions(text: string): { cleaned: string; mentions: string[] } {
	const mentions: string[] = [];
	let match;

	while ((match = MENTION_REGEX.exec(text)) !== null) {
		const username = match[1];
		if (!mentions.includes(username)) {
			mentions.push(username);
		}
	}
	MENTION_REGEX.lastIndex = 0;

	const cleaned = text.replace(MENTION_REGEX, '').replace(/\s{2,}/g, ' ').trim();
	return { cleaned, mentions };
}

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

const TODO_LINE_REGEX = new RegExp(`^\\s*\\W+\\s*${KEYWORD}\\b`, 'i');

function extractBody(changes: Change[], startIndex: number, prefix: string): string | false {
	const bodyLines: string[] = [];
	const trimmedPrefix = prefix.replace(/\s+$/, '').trim();
	const startType = changes[startIndex].type;

	for (let j = startIndex + 1; j < changes.length; j++) {
		const next = changes[j];
		if (next.type !== startType) break;

		const content = next.content.slice(1);

		if (TODO_LINE_REGEX.test(content)) break;

		const prefixMatch = content.match(new RegExp(`^\\s*${trimmedPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
		if (!prefixMatch) break;

		const lineText = content.slice(prefixMatch[0].length).trim();
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

				const { cleaned: labelCleaned, labels } = extractLabels(title);
				const { cleaned: mentionCleaned, mentions: titleMentions } = extractMentions(labelCleaned);
				title = mentionCleaned;
				if (!title) continue;

				const assignees = [...titleMentions];
				if (body) {
					const { mentions: bodyMentions } = extractMentions(body);
					for (const m of bodyMentions) {
						if (!assignees.includes(m)) assignees.push(m);
					}
				}

				if (title.length > 256) {
					title = title.slice(0, 253) + '...';
				}

				const line = change.type === 'add' ? (change as { ln: number }).ln : (change as { ln: number }).ln;

				const allLabels = labels.includes(DEFAULT_LABEL) ? labels : [DEFAULT_LABEL, ...labels];

				todos.push({
					type: change.type === 'add' ? 'add' : 'del',
					title,
					body,
					filename,
					line,
					labels: allLabels,
					assignees,
				});
			}
		}
	}

	return todos;
}
