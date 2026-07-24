import { createComposerHistory, type ComposerHistoryEntry } from './composerHistory';
import { getSelectionRange } from './selectionRange';

jest.mock('./selectionRange', () => ({
	getSelectionRange: jest.fn(() => ({ selectionStart: 0, selectionEnd: 0 })),
	setSelectionRange: jest.fn(),
}));

const mockedGetSelectionRange = getSelectionRange as jest.Mock;

const makeInput = (): HTMLDivElement => {
	const div = document.createElement('div');
	let value = '';
	// jsdom does not implement innerText; back it with a simple string.
	Object.defineProperty(div, 'innerText', {
		configurable: true,
		get: () => value,
		set: (v: string) => {
			value = v;
		},
	});
	document.body.appendChild(div);
	return div;
};

describe('createComposerHistory', () => {
	let clock = 0;
	const now = () => clock;

	beforeEach(() => {
		clock = 0;
		mockedGetSelectionRange.mockReturnValue({ selectionStart: 0, selectionEnd: 0 });
	});

	afterEach(() => {
		document.body.innerHTML = '';
		jest.clearAllMocks();
	});

	const setState = (input: HTMLDivElement, text: string, start = text.length, end = start) => {
		input.innerText = text;
		mockedGetSelectionRange.mockReturnValue({ selectionStart: start, selectionEnd: end });
	};

	const typeInput = (input: HTMLDivElement, text: string, data = text.slice(-1), inputType = 'insertText') => {
		setState(input, text);
		input.dispatchEvent(new InputEvent('input', { inputType, data, bubbles: true }));
	};

	const programmatic = (input: HTMLDivElement, text: string) => {
		setState(input, text);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	};

	it('coalesces consecutive typing into a single undo step', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'h');
		typeInput(input, 'he');
		typeInput(input, 'hey');

		history.undo();
		history.undo();

		expect(applyState).toHaveBeenCalledTimes(1);
		expect(applyState).toHaveBeenCalledWith(expect.objectContaining({ text: '' }));
	});

	it('breaks the undo step when the caret moves between edits', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'a');
		typeInput(input, 'ab', 'b');
		typeInput(input, 'abc', 'c');

		// Move the caret to the start, then make a noncontiguous edit.
		mockedGetSelectionRange.mockReturnValue({ selectionStart: 0, selectionEnd: 0 });
		input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'x', bubbles: true }));

		setState(input, 'xabc', 1);
		input.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: 'x', bubbles: true }));

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'abc' }));

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: '' }));
	});

	it('restores the caret to the edit location after an edit at a moved caret', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'abc');

		// Move the caret to the start (caret moves do not fire input), then edit there.
		mockedGetSelectionRange.mockReturnValue({ selectionStart: 0, selectionEnd: 0 });
		input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'x', bubbles: true }));

		setState(input, 'xabc', 1);
		input.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: 'x', bubbles: true }));

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'abc', selectionStart: 0, selectionEnd: 0 }));
	});

	it('breaks the undo step on whitespace boundaries', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'h');
		typeInput(input, 'he');
		typeInput(input, 'hey');
		typeInput(input, 'hey ', ' ');
		typeInput(input, 'hey y', 'y');
		typeInput(input, 'hey yo', 'o');

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'hey ' }));

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: '' }));

		expect(applyState).toHaveBeenCalledTimes(2);
	});

	it('breaks the undo step after a pause longer than the coalesce timeout', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'a');
		clock = 2000;
		typeInput(input, 'ab', 'b');

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'a' }));
		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: '' }));
	});

	it('breaks the undo step when switching between insert and delete', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'a');
		typeInput(input, 'ab', 'b');
		typeInput(input, 'a', '', 'deleteContentBackward');

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'ab' }));
	});

	it('treats a paste as its own undo step', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'x');
		typeInput(input, 'xpasted', 'pasted', 'insertFromPaste');

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'x' }));
	});

	it('treats a programmatic change as its own undo step', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'a');
		programmatic(input, '*a*');

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'a' }));
	});

	it('does not create a ghost step for a re-selection after a formatting change', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'bold');

		// Select all ('bold' -> range 0..4), then apply bold. The execCommand replacement fires
		// beforeinput with the pre-edit range still live (marks a replace boundary), then two input
		// events with identical text but different selections (caret at end, then 'bold' reselected).
		mockedGetSelectionRange.mockReturnValue({ selectionStart: 0, selectionEnd: 4 });
		input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', bubbles: true }));
		setState(input, '*bold*', 6, 6);
		input.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: '*bold*', bubbles: true }));
		setState(input, '*bold*', 1, 5);
		input.dispatchEvent(new Event('input', { bubbles: true }));

		history.undo();
		expect(applyState).toHaveBeenCalledTimes(1);
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'bold' }));
	});

	it('starts a new undo step when typing replaces a selected range', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'foo');

		// Select all via keyboard, then type over the selection. The keydown fires on the document
		// capture phase with the range still live, marking a replace boundary.
		mockedGetSelectionRange.mockReturnValue({ selectionStart: 0, selectionEnd: 3 });
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
		typeInput(input, 'x', 'x');

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'foo' }));
	});

	it('clears the redo stack when a new change is recorded after an undo', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'a');
		typeInput(input, 'ab', 'b');
		history.undo();

		typeInput(input, 'ac', 'c');
		applyState.mockClear();
		history.redo();

		expect(applyState).not.toHaveBeenCalled();
	});

	it('does not re-record changes dispatched from within applyState', () => {
		const input = makeInput();
		const applyState = jest.fn((entry: ComposerHistoryEntry) => {
			setState(input, entry.text);
			input.dispatchEvent(new InputEvent('input', { inputType: 'insertText', bubbles: true }));
		});
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'a');
		clock = 2000;
		typeInput(input, 'ab', 'b');

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'a' }));

		history.redo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'ab' }));
	});

	it('caps the undo stack at the configured limit', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, limit: 2, now });

		programmatic(input, 'a');
		programmatic(input, 'b');
		programmatic(input, 'c');
		programmatic(input, 'd');

		history.undo();
		history.undo();
		history.undo();

		expect(applyState).toHaveBeenCalledTimes(2);
	});

	it('handles undo/redo keyboard shortcuts and prevents the default', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'a');
		typeInput(input, 'ab', 'b');

		const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true });
		const undoSpy = jest.spyOn(undoEvent, 'preventDefault');
		input.dispatchEvent(undoEvent);
		expect(undoSpy).toHaveBeenCalled();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: '' }));

		const redoEvent = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true, cancelable: true });
		const redoSpy = jest.spyOn(redoEvent, 'preventDefault');
		input.dispatchEvent(redoEvent);
		expect(redoSpy).toHaveBeenCalled();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'ab' }));

		history.release();
	});

	it('commits a single undo step for an IME composition', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'a');

		input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		// insertCompositionText events during composition are ignored
		setState(input, 'a日');
		input.dispatchEvent(new InputEvent('input', { inputType: 'insertCompositionText', data: '日', bubbles: true }));
		setState(input, 'a日本');
		input.dispatchEvent(new CompositionEvent('compositionend', { data: '日本', bubbles: true }));

		history.undo();
		expect(applyState).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'a' }));
	});

	it('stops recording after release', () => {
		const input = makeInput();
		const applyState = jest.fn();
		const history = createComposerHistory({ input, applyState, now });

		typeInput(input, 'a');
		history.release();

		mockedGetSelectionRange.mockClear();

		typeInput(input, 'ab', 'b');

		expect(mockedGetSelectionRange).not.toHaveBeenCalled();

		const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true });
		input.dispatchEvent(undoEvent);

		expect(applyState).not.toHaveBeenCalled();
	});
});
