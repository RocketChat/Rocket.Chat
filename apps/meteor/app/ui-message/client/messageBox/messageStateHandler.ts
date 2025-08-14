import { parse, type Options, type Root } from '@rocket.chat/message-parser';
import type { Dispatch, SetStateAction } from 'react';

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

// Resolve state of the composer during text composition
export const resolveComposerBox = (
	eventOrInput: InputEvent | KeyboardEvent | React.FocusEvent<HTMLElement> | HTMLDivElement,
	setMdLines: Dispatch<SetStateAction<string[]>>,
	setCursorHistory: Dispatch<SetStateAction<CursorHistory>>,
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
		input = event.target as HTMLDivElement;

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

		const ast = parseMessage(input.innerText, parseOptions);

		console.log(text);
		console.log(ast);
	}, 0);
};
