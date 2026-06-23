export type EditableTextAdapter = {
	textBeforeCaret(): string;
	caret(): number;
	replaceRange(text: string, start: number, end: number): void;
};
