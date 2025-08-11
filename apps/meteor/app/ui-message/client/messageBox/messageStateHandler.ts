import type { Dispatch, SetStateAction } from 'react';

import { getCursorSelectionInfo, getSelectionRange } from './selectionRange';

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

// Resolve state of the composer during beforeInput
export const resolveBeforeInput = (
	event: InputEvent,
	setMdLines: Dispatch<SetStateAction<string[]>>,
	setCursorHistory: Dispatch<SetStateAction<CursorHistory>>,
): void => {
	const input = event.target as HTMLDivElement;

	const selection = getSelectionRange(input);
	const { selectionStart, selectionEnd } = selection;

	const lineInfo = getCursorSelectionInfo(input, selection);
	const { start, end } = lineInfo;

	console.log('event', e);
	console.log('input', input);
	setMdLines(getTextLines(input.innerText, '\n'));
};
