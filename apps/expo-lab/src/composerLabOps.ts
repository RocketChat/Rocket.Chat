export type Selection = { start: number; end: number };
export type Edit = { text: string; selection: Selection };

const marker = '{{text}}';

// Same string arithmetic as createComposerAPI.wrapSelection on the web, quirks included (a negative slice start wraps around)
export const wrapSelection = (value: string, { start, end }: Selection, pattern: string): Edit => {
	const at = pattern.indexOf(marker);
	const startPattern = pattern.slice(0, at);
	const endPattern = pattern.slice(at + marker.length);
	const selected = value.slice(start, end);

	const wrapped = value.slice(start - startPattern.length, start) === startPattern && value.slice(end, end + endPattern.length) === endPattern;
	if (wrapped) {
		const from = start - startPattern.length;
		return {
			text: value.slice(0, from) + selected + value.slice(end + endPattern.length),
			selection: { start: from, end: from + selected.length },
		};
	}

	return {
		text: value.slice(0, start) + pattern.replace(marker, selected) + value.slice(end),
		selection: { start: start + at, end: start + at + selected.length },
	};
};

// The web setText with a selection function: the text replaces the selection and the range then moves by the text length
export const insertText = (value: string, { start, end }: Selection, inserted: string): Edit => {
	const text = value.slice(0, start) + inserted + value.slice(end);
	return { text, selection: { start: start + inserted.length, end: Math.min(end + inserted.length, text.length) } };
};

export const replaceText = (value: string, inserted: string, { start, end }: Selection): Edit => {
	const caret = start + inserted.length;
	return { text: value.slice(0, start) + inserted + value.slice(end), selection: { start: caret, end: caret } };
};
