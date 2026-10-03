import { createComposerRenderer, renderComposerContent, resolveComposerBox } from './messageStateHandler';
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

// The renderer only reacts to real user input, and `isTrusted` is unforgeable on the event wrapper,
// so the flag has to be flipped on the jsdom implementation object the getter reads from.
const markTrusted = (event: Event): void => {
	const implSymbol = Object.getOwnPropertySymbols(event).find((symbol) => symbol.description === 'impl');

	if (!implSymbol) {
		throw new Error('could not reach the jsdom event implementation to mark the event as trusted');
	}

	// dispatchEvent assigns `isTrusted = false` on the way in, so the flag is exposed as a getter that
	// swallows that write.
	Object.defineProperty((event as unknown as Record<symbol, object>)[implSymbol], 'isTrusted', {
		get: () => true,
		set: () => undefined,
		configurable: true,
	});
};

const dispatchInput = (input: HTMLDivElement, isComposing = false): void => {
	const event = new InputEvent('input', { bubbles: true, isComposing });
	markTrusted(event);
	input.dispatchEvent(event);
};

const nextFrame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));

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

describe('createComposerRenderer', () => {
	beforeEach(() => {
		renderMock.mockReturnValue('<span>rendered</span>');
	});

	it('renders on plain input', () => {
		const input = mountInput('a');
		const { release } = createComposerRenderer(input, {});

		dispatchInput(input);

		expect(renderMock).toHaveBeenCalledTimes(1);
		release();
	});

	it('ignores untrusted input so programmatic changes do not trigger a rerender', () => {
		const input = mountInput('a');
		const { release } = createComposerRenderer(input, {});

		input.dispatchEvent(new InputEvent('input', { bubbles: true }));

		expect(renderMock).not.toHaveBeenCalled();
		release();
	});

	it('holds the render back while a composition is in flight', () => {
		const input = mountInput('˜');
		const { release } = createComposerRenderer(input, {});

		input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		dispatchInput(input, true);

		expect(renderMock).not.toHaveBeenCalled();
		release();
	});

	it('renders once the composition commits', async () => {
		const input = mountInput('ã');
		const { release } = createComposerRenderer(input, {});

		input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		dispatchInput(input, true);
		input.dispatchEvent(new CompositionEvent('compositionend', { data: 'ã', bubbles: true }));
		await nextFrame();

		expect(renderMock).toHaveBeenCalledTimes(1);
		release();
	});

	it('renders only once when the browser fires the committing input after compositionend', async () => {
		const input = mountInput('ã');
		const { release } = createComposerRenderer(input, {});

		// Firefox order: compositionend first, then the committing input with isComposing already false.
		input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		input.dispatchEvent(new CompositionEvent('compositionend', { data: 'ã', bubbles: true }));
		dispatchInput(input);
		await nextFrame();

		expect(renderMock).toHaveBeenCalledTimes(1);
		release();
	});

	it('does not render into a composition that started before the scheduled frame ran', async () => {
		const input = mountInput('ã');
		const { release } = createComposerRenderer(input, {});

		input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		input.dispatchEvent(new CompositionEvent('compositionend', { data: 'ã', bubbles: true }));
		input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		await nextFrame();

		expect(renderMock).not.toHaveBeenCalled();
		release();
	});

	it('does not render a composer that was cleared between the commit and the scheduled frame', async () => {
		const input = mountInput('ã');
		const { release } = createComposerRenderer(input, {});

		input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		input.dispatchEvent(new CompositionEvent('compositionend', { data: 'ã', bubbles: true }));
		// Sending clears the composer, and rendering '' would put the renderer's trailing newline back in.
		Object.defineProperty(input, 'innerText', { value: '', writable: true, configurable: true });
		await nextFrame();

		expect(renderMock).not.toHaveBeenCalled();
		release();
	});

	it('stops rendering after release', async () => {
		const input = mountInput('a');
		const { release } = createComposerRenderer(input, {});

		release();
		dispatchInput(input);
		input.dispatchEvent(new CompositionEvent('compositionend', { data: 'a', bubbles: true }));
		await nextFrame();

		expect(renderMock).not.toHaveBeenCalled();
	});
});
