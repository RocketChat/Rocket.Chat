import { createRichTextComposerAPI } from './createRichTextComposerAPI';
import { getSelectionRange, setSelectionRange } from './selectionRange';

jest.mock('../../../../client/lib/chats/uploads', () => ({
	createUploadsAPI: () => ({}),
}));

jest.mock('../../../../client/lib/utils/renderEmoji', () => ({
	getEmojiClassNameAndDataTitle: () => ({}),
}));

let innerTextDescriptor: PropertyDescriptor | undefined;
let originalExecCommand: typeof document.execCommand | undefined;

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
	originalExecCommand = (document as unknown as { execCommand?: typeof document.execCommand }).execCommand;
	(document as unknown as { execCommand: () => boolean }).execCommand = () => false;
});

afterAll(() => {
	if (innerTextDescriptor) {
		Object.defineProperty(HTMLElement.prototype, 'innerText', innerTextDescriptor);
	} else {
		delete (HTMLElement.prototype as unknown as { innerText?: unknown }).innerText;
	}

	if (originalExecCommand) {
		(document as unknown as { execCommand: typeof document.execCommand }).execCommand = originalExecCommand;
	} else {
		delete (document as unknown as { execCommand?: unknown }).execCommand;
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
		document.body.appendChild(input);
		const composer = createRichTextComposerAPI(input, jest.fn(), '', Number.MAX_SAFE_INTEGER, {}, { current: null }, { rid: 'GENERAL' });

		input.innerHTML = '<br>';
		expect(input.firstChild?.nodeName).toBe('BR');

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

		expect(input.textContent).toBe('*test*\n');
	});

	it('keeps the closing marker on the same line when the selection includes a trailing newline', () => {
		const { composer, input } = setupComposer('test\n', { start: 0, end: 5 });

		composer.wrapSelection('*{{text}}*');

		expect(input.textContent).toBe('*test*\n');
	});

	it('does not pull following-line text into the wrap for the last word of a line', () => {
		const { composer, input } = setupComposer('test\nfoo', { start: 0, end: 5 });

		composer.wrapSelection('*{{text}}*');

		expect(input.textContent).toBe('*test*\nfoo\n');
	});

	it('preserves internal newlines and does not duplicate the last character', () => {
		const { composer, input } = setupComposer('foo\nbar', { start: 0, end: 7 });

		composer.wrapSelection('*{{text}}*');

		expect(input.textContent).toContain('*foo\nbar*');
		expect(input.textContent).not.toContain('bar*r');
	});

	it('unwraps a selection that is already wrapped with the given pattern', () => {
		const { composer, input } = setupComposer('*test*', { start: 1, end: 5 });

		composer.wrapSelection('*{{text}}*');

		expect(input.textContent).toBe('test\n');
		expect(getSelectionRange(input)).toEqual({ selectionStart: 0, selectionEnd: 4 });
	});

	it('unwraps a multi-line selection that is already wrapped', () => {
		const { composer, input } = setupComposer('*foo\nbar*', { start: 1, end: 8 });

		composer.wrapSelection('*{{text}}*');

		expect(input.textContent).toContain('foo\nbar');
		expect(input.textContent).not.toContain('*');
	});

	it('does not unwrap when only the start marker is present', () => {
		const { composer, input } = setupComposer('*test', { start: 1, end: 5 });

		composer.wrapSelection('*{{text}}*');

		expect(input.textContent).toBe('**test*\n');
	});

	it('preserves blank lines (does not collapse consecutive newlines)', () => {
		const { composer, input } = setupComposer('123\n456\n\n789', { start: 0, end: 12 });

		composer.wrapSelection('*{{text}}*');

		expect(input.textContent).toContain('*123\n456\n\n789*');
		expect(input.textContent).not.toContain('456\n789');
	});
});
