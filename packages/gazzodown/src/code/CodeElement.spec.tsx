import { render, screen } from '@testing-library/react';

import CodeElement from './CodeElement';

describe('CodeElement', () => {
	it('renders inline code', () => {
		render(<CodeElement code='console.log()' />);
		expect(screen.getByText('console.log()')).toBeInTheDocument();
	});

	it('renders with code-colors class', () => {
		render(<CodeElement code='x = 1' />);
		const codeEl = screen.getByText('x = 1');
		expect(codeEl.tagName).toBe('CODE');
		expect(codeEl).toHaveClass('code-colors', 'inline');
	});

	it('matches snapshot', () => {
		const { container } = render(<CodeElement code='const x = 42;' />);
		expect(container).toMatchSnapshot();
	});
});
