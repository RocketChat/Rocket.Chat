import { parse, type Options, type Root } from '@rocket.chat/message-parser';
import type { Dispatch, SetStateAction } from 'react';

import { parseAST } from './messageParser';
import { getCursorSelectionInfo, getSelectionRange, setSelectionRange } from './selectionRange';

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

	// 1. Regex for all your link formats
	const patterns = [
		// Markdown reference links
		/\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g,
		// Slack-style links
		/<([^>|]+)\|([^>]+)>/g,
		// Bare domain
		/\b[a-z0-9-]+\.(?:[a-z]{2,})(?:\/[^\s]*)?/gi,
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
}

const restoreLinks = (html: string, matches: string[]): string => {
	return html.replace(/\[\[\[LINK_(\d+)\]\]\]/g, (_, i) => matches[parseInt(i, 10)] || '');
}

// Resolve state of the composer during text composition
export const resolveComposerBox = (
	eventOrInput: InputEvent | KeyboardEvent | React.FocusEvent<HTMLElement> | HTMLDivElement,
	_setMdLines: Dispatch<SetStateAction<string[]>>,
	_setCursorHistory: Dispatch<SetStateAction<CursorHistory>>,
	parseOptions: Options,
): void => {
	// Determine whether first arg is an event or an input node
	let input: HTMLDivElement;
	if (eventOrInput instanceof HTMLElement) {
		// Called programmatically
		input = eventOrInput as HTMLDivElement;
	} else {
		// Called from event
		const event = eventOrInput;
		const node = event.target as HTMLElement;
		// Always ensure input is the contenteditable
		// This resolves an issue where pasting inside an empty composer
		// removes the <br> tag which the paste event targets
		input = node.closest('[contenteditable="true"]') as HTMLDivElement;

		// Handle undo/redo for InputEvents
		if ('inputType' in event) {
			if (event.inputType === 'historyUndo') {
				console.log('Undo detected → performing programmatic undo');
				// document.execCommand("undo");
				return;
			}

			if (event.inputType === 'historyRedo') {
				console.log('Redo detected → performing programmatic redo');
				// document.execCommand("redo");
				return;
			}
		}
	}

	// Get state of the text before any updation
	const beforeText = input.innerText;

	// Delay so DOM reflects the change
	setTimeout(() => {
		// console.log('resolved data', input.innerText);
		// document.execCommand('insertHTML', false, 'test');
		const text = input.innerText;

		const selection = getSelectionRange(input);
		const { selectionStart, selectionEnd } = selection;

		const lineInfo = getCursorSelectionInfo(input, selection);
		const { start, end } = lineInfo;

		// setSelectionRange(input, 0, text.length);

		// Check if the event is a focus type event on the editor
		// If it is, check whether the text state has updated
		// Then resolve the state update by parsing the message into Markup
		if (!(eventOrInput instanceof FocusEvent) || beforeText !== text) {
			// Extract the URL and substitue with a safe template
			const { output: safeText, matches } = protectLinks(text === '' ? '\n' : text);

			// Parse the safetext
			const ast = parseMessage(safeText, parseOptions);

			// Parse the AST
			const html = parseAST(ast);

			// Restore the substituted links
			const finalHtml = restoreLinks(html, matches);
			console.log(finalHtml);
		}
	}, 0);
};
