import { handleSelectionWrapping } from './wrapSelection';
import type { ChatAPI, ComposerAPI } from '../../../../lib/chats/ChatAPI';

const createTextarea = (value: string, selectionStart: number, selectionEnd: number): HTMLTextAreaElement => {
	const textarea = document.createElement('textarea');
	textarea.value = value;
	textarea.selectionStart = selectionStart;
	textarea.selectionEnd = selectionEnd;
	return textarea;
};

const createMockComposer = (text: string): Pick<ComposerAPI, 'text' | 'wrapSelection'> => ({
	text,
	wrapSelection: jest.fn(() => ({ selectionStart: 0, selectionEnd: 0, value: '' })),
});

const createInputEvent = (textarea: HTMLTextAreaElement, data: string, isComposing = false): InputEvent => {
	const event = new InputEvent('input', {
		data,
		inputType: 'insertText',
		isComposing,
		bubbles: true,
		cancelable: true,
	});

	Object.defineProperty(event, 'target', { value: textarea, writable: false });

	return event;
};

describe('handleSelectionWrapping', () => {
	describe('dead key / IME composition scenarios', () => {
		it('should NOT wrap when the selected text is the same character just typed (dead key double-press)', () => {
			// Simulates: user presses ' twice on a Brazilian/international keyboard
			// After composition ends, the browser has:
			// - inserted the character ' into the textarea
			// - selected it (selectionStart=0, selectionEnd=1)
			// - fired an InputEvent with data="'"
			const textarea = createTextarea("'", 0, 1);
			const composer = createMockComposer("'");
			const chat = { composer } as unknown as ChatAPI;

			const event = createInputEvent(textarea, "'");

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(false);
			expect(composer.wrapSelection).not.toHaveBeenCalled();
		});

		it('should NOT wrap when dead key composition produces a character mid-text', () => {
			// User is typing "hello'" — the dead key inserts ' and selects it
			const textarea = createTextarea("hello'", 5, 6);
			const composer = createMockComposer("hello'");
			const chat = { composer } as unknown as ChatAPI;

			const event = createInputEvent(textarea, "'");

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(false);
			expect(composer.wrapSelection).not.toHaveBeenCalled();
		});

		it('should NOT wrap when backtick dead key is pressed twice', () => {
			const textarea = createTextarea('`', 0, 1);
			const composer = createMockComposer('`');
			const chat = { composer } as unknown as ChatAPI;

			const event = createInputEvent(textarea, '`');

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(false);
			expect(composer.wrapSelection).not.toHaveBeenCalled();
		});

		it('should NOT wrap when tilde dead key is pressed twice', () => {
			const textarea = createTextarea('˜', 0, 1);
			const composer = createMockComposer('˜');
			const chat = { composer } as unknown as ChatAPI;

			const event = createInputEvent(textarea, '˜');

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(false);
			expect(composer.wrapSelection).not.toHaveBeenCalled();
		});
	});

	describe('legitimate wrapping scenarios', () => {
		it('should wrap when user selects text and types a wrapping character', () => {
			// User selects "hello" and types '
			const textarea = createTextarea('hello', 0, 5);
			const composer = createMockComposer('hello');
			const chat = { composer } as unknown as ChatAPI;

			const event = createInputEvent(textarea, "'");

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(true);
			expect(composer.wrapSelection).toHaveBeenCalledWith("'{{text}}'");
		});

		it('should wrap when user selects partial text and types a wrapping character', () => {
			// User selects "world" in "hello world" and types *
			const textarea = createTextarea('hello world', 6, 11);
			const composer = createMockComposer('hello world');
			const chat = { composer } as unknown as ChatAPI;

			const event = createInputEvent(textarea, '*');

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(true);
			expect(composer.wrapSelection).toHaveBeenCalledWith('*{{text}}*');
		});

		it('should wrap with backtick when text is selected', () => {
			const textarea = createTextarea('some code here', 5, 9);
			const composer = createMockComposer('some code here');
			const chat = { composer } as unknown as ChatAPI;

			const event = createInputEvent(textarea, '`');

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(true);
			expect(composer.wrapSelection).toHaveBeenCalledWith('`{{text}}`');
		});
	});

	describe('no-op scenarios', () => {
		it('should return false when there is no selection (cursor only)', () => {
			const textarea = createTextarea('hello', 3, 3);
			const composer = createMockComposer('hello');
			const chat = { composer } as unknown as ChatAPI;

			const event = createInputEvent(textarea, "'");

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(false);
			expect(composer.wrapSelection).not.toHaveBeenCalled();
		});

		it('should return false when there is no composer', () => {
			const textarea = createTextarea('hello', 0, 5);
			const chat = {} as unknown as ChatAPI;

			const event = createInputEvent(textarea, "'");

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(false);
		});

		it('should return false for non-wrapping characters', () => {
			const textarea = createTextarea('hello', 0, 5);
			const composer = createMockComposer('hello');
			const chat = { composer } as unknown as ChatAPI;

			const event = createInputEvent(textarea, 'a');

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(false);
			expect(composer.wrapSelection).not.toHaveBeenCalled();
		});

		it('should return false when event.data is null', () => {
			const textarea = createTextarea('hello', 0, 5);
			const composer = createMockComposer('hello');
			const chat = { composer } as unknown as ChatAPI;

			const event = new InputEvent('input', {
				data: null,
				inputType: 'deleteContentBackward',
				bubbles: true,
			});
			Object.defineProperty(event, 'target', { value: textarea, writable: false });

			const result = handleSelectionWrapping(event, chat);

			expect(result).toBe(false);
			expect(composer.wrapSelection).not.toHaveBeenCalled();
		});
	});
});
