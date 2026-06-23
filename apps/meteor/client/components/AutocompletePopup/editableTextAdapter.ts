export type EditableTextAdapter = {
	textBeforeCaret(): string;
	caret(): number;
	replaceRange(text: string, start: number, end: number): void;
};

type InputLike = HTMLInputElement | HTMLTextAreaElement;

// the prototype's native setter is what makes React's onChange fire on a programmatic edit
const setNativeValue = (input: InputLike, value: string) => {
	const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
	const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
	setter?.call(input, value);
};

export const fromInputElement = (getInput: () => InputLike | null): EditableTextAdapter => ({
	textBeforeCaret: () => {
		const input = getInput();
		return input ? input.value.substring(0, input.selectionStart ?? input.value.length) : '';
	},
	caret: () => getInput()?.selectionStart ?? 0,
	replaceRange: (text, start, end) => {
		const input = getInput();
		if (!input) {
			return;
		}
		const nextValue = input.value.slice(0, start) + text + input.value.slice(end);
		const caret = start + text.length;
		input.focus();
		setNativeValue(input, nextValue);
		input.setSelectionRange(caret, caret);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	},
});
