import { render } from '@testing-library/react';

import PreviewKatexElement from './PreviewKatexElement';

describe('PreviewKatexElement', () => {
	it('renders the code as plain text', () => {
		const { container } = render(<PreviewKatexElement code='x^2 + y^2' />);
		expect(container).toHaveTextContent('x^2 + y^2');
	});

	it('renders LaTeX commands as plain text', () => {
		const { container } = render(<PreviewKatexElement code='alpha + beta' />);
		expect(container).toHaveTextContent('alpha + beta');
	});

	it('matches snapshot', () => {
		const { container } = render(<PreviewKatexElement code='\\int_0^1 f(x) dx' />);
		expect(container).toMatchSnapshot();
	});
});
