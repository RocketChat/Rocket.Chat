import type { ComposerAPI } from '../../../../lib/chats/ChatAPI';
import { handleSelectionWrapping } from './wrapSelection';

const createMockTextArea = (value: string, selectionStart: number, selectionEnd: number): HTMLTextAreaElement =>
	({
		value,
		selectionStart,
		selectionEnd,
	}) as unknown as HTMLTextAreaElement;

const createMockInputEvent = (
	data: string | null,
	target: HTMLTextAreaElement,
	{ inputType = 'insertText', isComposing = false }: { inputType?: string; isComposing?: boolean } = {},
): InputEvent => {
	const event = {
		data,
		inputType,
		isComposing,
		target,
		preventDefault: jest.fn(),
	} as unknown as InputEvent;
	return event;
};

describe('handleSelectionWrapping', () => {
	const wrapSelection = jest.fn();
	const composer = { wrapSelection } as unknown as ComposerAPI;

	beforeEach(() => {
		wrapSelection.mockClear();
	});

	it('should return false when no text is selected', () => {
		const textarea = createMockTextArea('hello world', 5, 5);
		const event = createMockInputEvent('(', textarea);

		expect(handleSelectionWrapping(event, composer)).toBe(false);
		expect(wrapSelection).not.toHaveBeenCalled();
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should return false when the key is not a wrapping character', () => {
		const textarea = createMockTextArea('hello world', 0, 5);
		const event = createMockInputEvent('a', textarea);

		expect(handleSelectionWrapping(event, composer)).toBe(false);
		expect(wrapSelection).not.toHaveBeenCalled();
	});

	it('should return false when inputType is not insertText', () => {
		const textarea = createMockTextArea('hello world', 0, 5);
		const event = createMockInputEvent('(', textarea, { inputType: 'deleteContentBackward' });

		expect(handleSelectionWrapping(event, composer)).toBe(false);
		expect(wrapSelection).not.toHaveBeenCalled();
	});

	it('should return false when composing (IME active)', () => {
		const textarea = createMockTextArea('hello world', 0, 5);
		const event = createMockInputEvent('(', textarea, { isComposing: true });

		expect(handleSelectionWrapping(event, composer)).toBe(false);
		expect(wrapSelection).not.toHaveBeenCalled();
	});

	it('should return false when data is null', () => {
		const textarea = createMockTextArea('hello world', 0, 5);
		const event = createMockInputEvent(null, textarea);

		expect(handleSelectionWrapping(event, composer)).toBe(false);
		expect(wrapSelection).not.toHaveBeenCalled();
	});

	it.each([
		['`', '`{{text}}`'],
		['"', '"{{text}}"'],
		["'", "'{{text}}'"],
		['(', '({{text}})'],
		['<', '<{{text}}>'],
		['{', '{{{text}}}'],
		['[', '[{{text}}]'],
		['*', '*{{text}}*'],
	])('should wrap selected text when inserting "%s"', (data, expectedPattern) => {
		const textarea = createMockTextArea('hello world', 0, 5);
		const event = createMockInputEvent(data, textarea);

		expect(handleSelectionWrapping(event, composer)).toBe(true);
		expect(event.preventDefault).toHaveBeenCalled();
		expect(wrapSelection).toHaveBeenCalledWith(expectedPattern);
	});

	it('should not wrap when selection is collapsed (cursor only)', () => {
		const textarea = createMockTextArea('hello world', 3, 3);
		const event = createMockInputEvent('*', textarea);

		expect(handleSelectionWrapping(event, composer)).toBe(false);
		expect(wrapSelection).not.toHaveBeenCalled();
	});
});
