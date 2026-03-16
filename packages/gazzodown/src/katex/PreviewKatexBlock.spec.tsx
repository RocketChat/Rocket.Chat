import { render } from '@testing-library/react';

import PreviewKatexBlock from './PreviewKatexBlock';

describe('PreviewKatexBlock', () => {
	it('renders the code as plain text', () => {
		const { container } = render(<PreviewKatexBlock code='E = mc^2' />);
		expect(container).toHaveTextContent('E = mc^2');
	});

	it('renders complex expressions as plain text', () => {
		const { container } = render(<PreviewKatexBlock code='\\sum_{i=0}^{n} x_i' />);
		expect(container).toHaveTextContent('\\sum_{i=0}^{n} x_i');
	});

	it('matches snapshot', () => {
		const { container } = render(<PreviewKatexBlock code='\\frac{a}{b}' />);
		expect(container).toMatchSnapshot();
	});
});
