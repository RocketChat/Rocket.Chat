import { render } from 'preact';
import { act } from 'preact/test-utils';

import InputField, { ErrorsContext } from './InputField';

let root: HTMLElement;

beforeEach(() => {
	root = document.body.appendChild(document.createElement('div'));
});

afterEach(() => {
	render(null, root);
	root.remove();
});

const draw = (errors: Record<string, string>) =>
	// oxlint-disable-next-line testing-library/no-unnecessary-act
	act(() => {
		render(
			<ErrorsContext.Provider value={errors}>
				<InputField label='L' actionId='act'>
					<input />
				</InputField>
			</ErrorsContext.Provider>,
			root,
		);
	});

describe('InputField', () => {
	it('links the error to its input and clears the link with the error', () => {
		draw({ act: 'Required' });
		const input = root.querySelector('input');

		expect(input?.getAttribute('aria-invalid')).toBe('true');
		expect(root.querySelector(`#${input?.getAttribute('aria-describedby')}`)?.textContent).toBe('Required');

		draw({});
		expect(input?.hasAttribute('aria-invalid')).toBe(false);
		expect(input?.hasAttribute('aria-describedby')).toBe(false);
	});
});
