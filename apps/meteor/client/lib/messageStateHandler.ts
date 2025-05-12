import { parse, type Options, type Root } from '@rocket.chat/message-parser';

import { parseAST } from './messageParser';
import { getSelectionRange, setSelectionRange } from './selectionRange';

export type CursorHistory = {
	undoStack: number[];
	redoStack: number[];
};

// Return an array of strings representing each line of the Composer
export const getTextLines = (str: string, delimiter: string): string[] => {
	const result = [];
	let start = 0;
	let index;

	while ((index = str.indexOf(delimiter, start)) !== -1) {
		result.push(str.slice(start, index));
		start = index + delimiter.length;
	}

	// Only push final part if it's not empty OR string didn't end with delimiter
	if (!(start === str.length && delimiter === str[str.length - 1])) {
		result.push(str.slice(start));
	}

	return result;
};

const parseMessage = (text: string, parseOptions: Options): Root => {
	return parse(text, parseOptions);
};

// TODO: Investigate an issue where Slack style links are not working properly
// This might have to do with the symbols < and > not resolving into websafe characters
const protectLinks = (text: string): { output: string; matches: string[] } => {
	const matches: string[] = [];
	let idx = 0;

	const patterns = [
		// Markdown reference links
		/\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g,

		// Slack-style links
		/<([^>|]+)\|([^>]+)>/g,

		// Emails
		/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,

		// Bare domains / URLs (not after @ so we don't eat mentions)
		/(?<!@)\b[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi,
	];

	let output = text;

	patterns.forEach((regex) => {
		output = output.replace(regex, (full) => {
			const placeholder = `[[[LINK_${idx}]]]`;
			matches[idx++] = full;
			return placeholder;
		});
	});

	return { output, matches };
};

const restoreLinks = (html: string, matches: string[]): string => {
	return html.replace(/\[\[\[LINK_(\d+)\]\]\]/g, (_, i) => matches[parseInt(i, 10)] || '');
};

// Resolve the Composer after the user modifies text
export const resolveComposerBox = (event: Event, parseOptions: Options) => {
	if (!event.isTrusted) return;

	const target = event.target as HTMLDivElement;
	const text = target.innerText;

	// Get the position of the cursor after text modification
	// This is so that after parsing and rendering inside the editor
	// the cursor is restored to the correct position
	const selection = getSelectionRange(target);
	const { selectionStart, selectionEnd } = selection;

	// Extract the URL and substitue with a safe template
	const { output: safeText, matches } = protectLinks(text === '' ? '\n' : text);

	// Parse the safetext
	const ast = parseMessage(safeText, parseOptions);

	// Parse the AST
	const html = parseAST(ast);
	console.log(ast);

	// Restore the substituted links
	let finalHtml = restoreLinks(html, matches);

	// Prevent newline explosion after every end of heading updation
	finalHtml = finalHtml
		.replace(/<\/h1><br\s*\/?>/gi, '</h1>')
		.replace(/<\/h2><br\s*\/?>/gi, '</h2>')
		.replace(/<\/h3><br\s*\/?>/gi, '</h3>')
		.replace(/<\/h4><br\s*\/?>/gi, '</h4>');

	// Rendering pipeline
	target.innerHTML = finalHtml; // This works but it destroys the undo history

	// Select the entire composer
	// setSelectionRange(target, 0, text.length);

	// This execCommand is supposed to work, while preserving edit history
	// However it explodes because insertHTML itself fires the input event
	// document.execCommand('insertHTML', false, finalHtml);

	// Restore the cursor to the correct position
	setSelectionRange(target, selectionStart, selectionEnd);
};
