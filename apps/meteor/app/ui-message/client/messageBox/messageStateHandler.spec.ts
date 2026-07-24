import { resolveComposerBox } from './messageStateHandler';

jest.mock('./renderComposerMarkup', () => ({
	renderComposerMarkup: () => '<p>rendered</p>',
}));

describe('resolveComposerBox', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('ignores untrusted events so programmatic changes do not trigger a rerender', () => {
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
