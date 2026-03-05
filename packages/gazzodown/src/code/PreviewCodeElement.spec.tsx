import { render, screen } from '@testing-library/react';

import PreviewCodeElement from './PreviewCodeElement';

describe('PreviewCodeElement', () => {
	it('renders the code text', () => {
		render(<PreviewCodeElement code='console.log("hello")' />);
		expect(screen.getByText('console.log("hello")')).toBeInTheDocument();
	});

	it('renders empty string without crashing', () => {
		const { container } = render(<PreviewCodeElement code='' />);
		expect(container).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(<PreviewCodeElement code='const x = 42;' />);
		expect(container).toMatchSnapshot();
	});
});
