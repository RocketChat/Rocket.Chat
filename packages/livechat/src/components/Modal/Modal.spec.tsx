import { render } from 'preact';

import Modal from './Modal';

let root: HTMLElement;

beforeEach(() => {
	root = document.body.appendChild(document.createElement('div'));
});

afterEach(() => {
	render(null, root);
	root.remove();
});

const tab = (shiftKey = false) => {
	const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true });
	window.dispatchEvent(event);
	return event;
};

describe('Modal', () => {
	it('is a named modal dialog that takes focus on open', () => {
		render(
			<Modal open aria-label='Title'>
				<button type='button'>a</button>
			</Modal>,
			root,
		);

		const dialog = root.querySelector('[role=dialog]');
		expect(dialog?.getAttribute('aria-modal')).toBe('true');
		expect(dialog?.getAttribute('aria-label')).toBe('Title');
		expect(document.activeElement).toBe(dialog);
	});

	it('keeps Tab inside the dialog', () => {
		render(
			<Modal open>
				<button type='button'>a</button>
				<button type='button'>b</button>
			</Modal>,
			root,
		);
		const [a, b] = Array.from(root.querySelectorAll('button'));

		b.focus();
		expect(tab().defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(a);

		expect(tab(true).defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(b);
	});

	it('gives focus back to the opener on close', () => {
		const opener = document.body.appendChild(document.createElement('button'));
		opener.focus();
		render(<Modal open />, root);

		render(null, root);

		expect(document.activeElement).toBe(opener);
		opener.remove();
	});
});
