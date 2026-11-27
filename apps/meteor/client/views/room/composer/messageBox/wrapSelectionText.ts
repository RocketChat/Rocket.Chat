type Selection = { readonly start: number; readonly end: number };

type WrapSelectionResult = {
	text: string;
	selection: Selection;
	toggledOff: boolean;
	/** The span of the input text that the edit replaces, and what it puts there. */
	replacement: { start: number; end: number; text: string };
};

/**
 * Wraps the selection in `pattern` (`{{text}}` marks the selection), or removes the markers
 * when they already surround it. The result's selection covers the original selected text.
 */
export const wrapSelectionText = (
	text: string,
	{ start: selectionStart, end: selectionEnd }: Selection,
	pattern: string,
): WrapSelectionResult => {
	const selectedText = text.slice(selectionStart, selectionEnd);

	const startPattern = pattern.slice(0, pattern.indexOf('{{text}}'));
	const startPatternFound = text.slice(selectionStart - startPattern.length, selectionStart) === startPattern;

	if (startPatternFound) {
		const endPattern = pattern.slice(pattern.indexOf('{{text}}') + '{{text}}'.length);
		const endPatternFound = text.slice(selectionEnd, selectionEnd + endPattern.length) === endPattern;

		if (endPatternFound) {
			const start = selectionStart - startPattern.length;
			const end = selectionEnd + endPattern.length;

			return {
				text: text.slice(0, start) + selectedText + text.slice(end),
				selection: { start, end: start + selectedText.length },
				toggledOff: true,
				replacement: { start, end, text: selectedText },
			};
		}
	}

	const wrapped = pattern.replace('{{text}}', selectedText);
	const start = selectionStart + pattern.indexOf('{{text}}');

	return {
		text: text.slice(0, selectionStart) + wrapped + text.slice(selectionEnd),
		selection: { start, end: start + selectedText.length },
		toggledOff: false,
		replacement: { start: selectionStart, end: selectionEnd, text: wrapped },
	};
};
