// TODO: Change the Selection API to support rich text as the current version may support flat text only.
/* Use Selection API to get the selectionStart and selectionEnd from contenteditable div */
export const getSelectionRange = (input: HTMLDivElement): { selectionStart: number; selectionEnd: number } => {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) {
		return { selectionStart: 0, selectionEnd: input.innerText.length };
	}

	const range = selection.getRangeAt(0);
	const preCaretRange = range.cloneRange();
	preCaretRange.selectNodeContents(input);
	preCaretRange.setEnd(range.startContainer, range.startOffset);
	const selectionStart = preCaretRange.toString().length;
	const selectionEnd = selectionStart + range.toString().length;

	return { selectionStart, selectionEnd };
};

/* Use Selection API to set a selection range in contenteditable div */
export const setSelectionRange = (input: HTMLDivElement, start: number, end: number): void => {
	const range = document.createRange();
	const sel = window.getSelection();

	if (input.firstChild) {
		range.setStart(input.firstChild, start);
		range.setEnd(input.firstChild, end);
	}

	sel?.removeAllRanges();
	sel?.addRange(range);
};
