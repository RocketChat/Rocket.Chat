import { render, screen } from '@testing-library/react';

import KatexBlock from './KatexBlock';

jest.mock('katex', () => ({
	renderToString: (code: string, options: { displayMode: boolean }) =>
		`<span class="katex${options.displayMode ? '-display' : ''}">${code}</span>`,
}));

describe('KatexBlock', () => {
	it('renders with role math', () => {
		render(<KatexBlock code='E = mc^2' />);
		expect(screen.getByRole('math')).toBeInTheDocument();
	});

	it('sets aria-label to the code', () => {
		render(<KatexBlock code='x^2 + y^2 = z^2' />);
		expect(screen.getByRole('math')).toHaveAttribute('aria-label', 'x^2 + y^2 = z^2');
	});

	it('renders katex output via dangerouslySetInnerHTML', () => {
		render(<KatexBlock code='\\frac{a}{b}' />);

		// eslint-disable-next-line testing-library/no-node-access
		const katexEl = screen.getByRole('math').querySelector('.katex-display');
		expect(katexEl).toBeInTheDocument();
		expect(katexEl).toHaveTextContent('\\frac{a}{b}');
	});

	it('renders in a div with overflowX auto', () => {
		render(<KatexBlock code='a' />);
		expect(screen.getByRole('math')).toHaveStyle({ overflowX: 'auto' });
	});

	it('matches snapshot', () => {
		const { container } = render(<KatexBlock code='\\sum_{i=0}^{n} i' />);
		expect(container).toMatchSnapshot();
	});
});
