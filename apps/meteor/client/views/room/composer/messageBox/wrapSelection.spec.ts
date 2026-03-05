import type { ComposerAPI } from '../../../../lib/chats/ChatAPI';
import { handleSelectionWrapping } from './wrapSelection';

const createMockTextArea = (value: string, selectionStart: number, selectionEnd: number): HTMLTextAreaElement =>
	({
		value,
		selectionStart,
		selectionEnd,
	}) as unknown as HTMLTextAreaElement;

const createMockKeyboardEvent = (key: string, target: HTMLTextAreaElement): KeyboardEvent => {
	const event = {
		key,
		target,
		preventDefault: jest.fn(),
	} as unknown as KeyboardEvent;
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
		const event = createMockKeyboardEvent('(', textarea);

		expect(handleSelectionWrapping(event, composer)).toBe(false);
		expect(wrapSelection).not.toHaveBeenCalled();
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should return false when the key is not a wrapping character', () => {
		const textarea = createMockTextArea('hello world', 0, 5);
		const event = createMockKeyboardEvent('a', textarea);

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
	])('should wrap selected text when pressing "%s"', (key, expectedPattern) => {
		const textarea = createMockTextArea('hello world', 0, 5);
		const event = createMockKeyboardEvent(key, textarea);

		expect(handleSelectionWrapping(event, composer)).toBe(true);
		expect(event.preventDefault).toHaveBeenCalled();
		expect(wrapSelection).toHaveBeenCalledWith(expectedPattern);
	});

	it('should not wrap when selection is collapsed (cursor only)', () => {
		const textarea = createMockTextArea('hello world', 3, 3);
		const event = createMockKeyboardEvent('*', textarea);

		expect(handleSelectionWrapping(event, composer)).toBe(false);
		expect(wrapSelection).not.toHaveBeenCalled();
	});
});
