import { createRichTextComposerAPI } from './createRichTextComposerAPI';
import { getSelectionRange, setSelectionRange } from './selectionRange';

jest.mock('../../../../client/lib/chats/uploads', () => ({
	createUploadsAPI: () => ({}),
}));

jest.mock('../../../../client/lib/utils/renderEmoji', () => ({
	getEmojiClassNameAndDataTitle: () => ({}),
}));

let innerTextDescriptor: PropertyDescriptor | undefined;

beforeAll(() => {
	innerTextDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText');
	Object.defineProperty(HTMLElement.prototype, 'innerText', {
		configurable: true,
		get() {
			return this.textContent ?? '';
		},
		set(value: string) {
			this.textContent = value;
		},
	});
	// Force the innerText fallback path in replaceText/setText (jsdom lacks execCommand anyway).
	(document as unknown as { execCommand: () => boolean }).execCommand = () => false;
});

afterAll(() => {
	if (innerTextDescriptor) {
		Object.defineProperty(HTMLElement.prototype, 'innerText', innerTextDescriptor);
	}
});

const setupComposer = (initialValue: string, cursor: { start: number; end: number }) => {
	const input = document.createElement('div');
	input.contentEditable = 'true';
	document.body.appendChild(input);

	const composer = createRichTextComposerAPI(input, jest.fn(), '', Number.MAX_SAFE_INTEGER, {}, { current: null }, { rid: 'GENERAL' });

	input.textContent = initialValue;
	setSelectionRange(input, cursor.start, cursor.end);

	return { composer, input };
};

describe('RichText Composer API - replaceText', () => {
	afterEach(() => {
		window.getSelection()?.removeAllRanges();
		document.body.innerHTML = '';
	});

	it('places the caret after a full emoji shortcode instead of one character in', () => {
		const { composer, input } = setupComposer(':smi', { start: 4, end: 4 });

		composer.replaceText(':smile:', { start: 0, end: 4 });

		expect(input.textContent).toBe(':smile:');
		expect(getSelectionRange(input)).toEqual({ selectionStart: 7, selectionEnd: 7 });
	});

	it('places the caret after a mention inserted at the start', () => {
		const { composer, input } = setupComposer('@jhello', { start: 2, end: 2 });

		composer.replaceText('@john ', { start: 0, end: 2 });

		expect(input.textContent).toBe('@john hello');
		expect(getSelectionRange(input)).toEqual({ selectionStart: 6, selectionEnd: 6 });
	});

	it('places the caret after a mention inserted in the middle', () => {
		const { composer, input } = setupComposer('hi @jthere', { start: 5, end: 5 });

		composer.replaceText('@john ', { start: 3, end: 5 });

		expect(input.textContent).toBe('hi @john there');
		expect(getSelectionRange(input)).toEqual({ selectionStart: 9, selectionEnd: 9 });
	});
});

describe('RichText Composer API - insertText', () => {
	afterEach(() => {
		window.getSelection()?.removeAllRanges();
		document.body.innerHTML = '';
	});

	it('inserts into an empty composer instead of doing nothing', () => {
		const { composer, input } = setupComposer('', { start: 0, end: 0 });

		composer.insertText(' :smile: ');

		expect(input.textContent).toBe(' :smile: ');
		expect(getSelectionRange(input)).toEqual({ selectionStart: 9, selectionEnd: 9 });
	});

	it('inserts into a composer holding only the placeholder <br>', () => {
		const input = document.createElement('div');
		input.contentEditable = 'true';
		input.innerHTML = '<br>';
		document.body.appendChild(input);
		const composer = createRichTextComposerAPI(input, jest.fn(), '', Number.MAX_SAFE_INTEGER, {}, { current: null }, { rid: 'GENERAL' });

		composer.insertText('hi');

		expect(input.textContent).toBe('hi');
		expect(getSelectionRange(input)).toEqual({ selectionStart: 2, selectionEnd: 2 });
	});

	it('inserts at the caret in the middle of existing text', () => {
		const { composer, input } = setupComposer('ac', { start: 1, end: 1 });

		composer.insertText('b');

		expect(input.textContent).toBe('abc');
		expect(getSelectionRange(input)).toEqual({ selectionStart: 2, selectionEnd: 2 });
	});

	it('still inserts when execCommand reports success but changes nothing', () => {
		const { execCommand } = document as unknown as { execCommand: () => boolean };
		(document as unknown as { execCommand: () => boolean }).execCommand = () => true;

		try {
			const { composer, input } = setupComposer('', { start: 0, end: 0 });

			composer.insertText(' :tada: ');

			expect(input.textContent).toBe(' :tada: ');
			expect(getSelectionRange(input)).toEqual({ selectionStart: 8, selectionEnd: 8 });
		} finally {
			(document as unknown as { execCommand: () => boolean }).execCommand = execCommand;
		}
	});
});

describe('RichText Composer API - wrapSelection', () => {
	afterEach(() => {
		window.getSelection()?.removeAllRanges();
		document.body.innerHTML = '';
	});

	it('wraps a selection with the given pattern', () => {
		const { composer, input } = setupComposer('test', { start: 0, end: 4 });

		composer.wrapSelection('*{{text}}*');

		expect(input.textContent).toBe('*test*');
	});

	it('keeps the closing marker on the same line when the selection includes a trailing newline', () => {
		// A double-click on the last word of a line selects the trailing paragraph newline too.
		const { composer, input } = setupComposer('test\n', { start: 0, end: 5 });

		composer.wrapSelection('*{{text}}*');

		expect(input.textContent).toBe('*test*\n');
	});

	it('does not pull following-line text into the wrap for the last word of a line', () => {
		const { composer, input } = setupComposer('test\nfoo', { start: 0, end: 5 });

		composer.wrapSelection('*{{text}}*');

		expect(input.textContent).toBe('*test*\nfoo');
	});
});
