import { render } from '@testing-library/react';

import KatexElement from './KatexElement';

jest.mock('katex', () => ({
	renderToString: (code: string, options: { displayMode: boolean }) =>
		`<span class="katex${options.displayMode ? '-display' : ''}">${code}</span>`,
}));

describe('KatexElement', () => {
	it('renders inline katex content', () => {
		const { container } = render(<KatexElement code='x^2' />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const katexEl = container.querySelector('.katex');
		expect(katexEl).toBeInTheDocument();
		expect(katexEl).toHaveTextContent('x^2');
	});

	it('renders in a span element', () => {
		const { container } = render(<KatexElement code='a + b' />);

		// eslint-disable-next-line testing-library/no-node-access
		expect(container.firstChild?.nodeName).toBe('SPAN');
	});

	it('does not use display mode', () => {
		const { container } = render(<KatexElement code='y' />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect(container.querySelector('.katex-display')).not.toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(<KatexElement code='\\alpha + \\beta' />);
		expect(container).toMatchSnapshot();
	});
});
