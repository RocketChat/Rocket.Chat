import { renderComposerContent, resolveComposerBox } from './messageStateHandler';
import { renderComposerMarkup } from './renderComposerMarkup';

jest.mock('./renderComposerMarkup', () => ({
	renderComposerMarkup: jest.fn(),
}));

const renderMock = renderComposerMarkup as jest.MockedFunction<typeof renderComposerMarkup>;

const mountInput = (text: string): HTMLDivElement => {
	const input = document.createElement('div');
	// jsdom does not implement innerText, which is what the composer reads.
	Object.defineProperty(input, 'innerText', { value: text, writable: true, configurable: true });
	document.body.appendChild(input);
	return input;
};

const render = (input: HTMLDivElement): void => renderComposerContent(input, {}, { selectionStart: 0, selectionEnd: 0 });

beforeEach(() => {
	renderMock.mockReset();
});

afterEach(() => {
	window.getSelection()?.removeAllRanges();
	document.body.innerHTML = '';
});

describe('resolveComposerBox', () => {
	it('ignores untrusted events so programmatic changes do not trigger a rerender', () => {
		renderMock.mockReturnValue('<span>rendered</span>');

		const input = document.createElement('div');
		input.innerHTML = '<p>original</p>';
		document.body.appendChild(input);

		// Events created in code are not trusted.
		const event = new Event('input', { bubbles: true });
		Object.defineProperty(event, 'target', { value: input });

		resolveComposerBox(event, {});

		expect(input.innerHTML).toBe('<p>original</p>');
	});
});

describe('renderComposerContent', () => {
	it('passes the parsed source to the renderer so nodes without a renderer can recover their markup', () => {
		renderMock.mockReturnValue('<span>a *b*\n</span>');

		render(mountInput('a *b*'));

		expect(renderMock).toHaveBeenCalledWith(expect.anything(), 'a *b*');
	});

	it('keeps the rendered markup when it holds the same text as the source', () => {
		renderMock.mockReturnValue('<span>a <strong>b</strong>\n</span>');

		const input = mountInput('a b');
		render(input);

		expect(input.querySelector('strong')).not.toBeNull();
	});

	it('falls back to the raw text when the render loses text', () => {
		renderMock.mockReturnValue('<span>\n</span>');

		const input = mountInput('- [ ] a task');
		render(input);

		expect(input.textContent).toBe('- [ ] a task');
	});

	it('falls back to the raw text when the render adds text', () => {
		renderMock.mockReturnValue('<span>hello there\n</span>');

		const input = mountInput('hello');
		render(input);

		expect(input.textContent).toBe('hello');
	});

	it('escapes the fallback so a lossy render cannot inject elements', () => {
		renderMock.mockReturnValue('<span>\n</span>');

		const text = 'x.com/<img src=x onerror=alert(1)><script>alert(2)</script>';
		const input = mountInput(text);
		render(input);

		expect(input.querySelector('img')).toBeNull();
		expect(input.querySelector('script')).toBeNull();
		expect(input.textContent).toBe(text);
	});
});
