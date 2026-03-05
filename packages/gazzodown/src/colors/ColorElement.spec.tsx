import { render, screen } from '@testing-library/react';

import ColorElement from './ColorElement';

describe('ColorElement', () => {
	it('renders color swatch with rgba text', () => {
		render(<ColorElement r={255} g={0} b={0} a={255} />);
		expect(screen.getByText(/rgba\(255, 0, 0/)).toBeInTheDocument();
	});

	it('renders with correct background color style', () => {
		render(<ColorElement r={128} g={64} b={32} a={128} />);
		const text = screen.getByText(/rgba\(128, 64, 32/);
		// eslint-disable-next-line testing-library/no-node-access
		const swatch = text.querySelector('span');
		expect(swatch).toHaveStyle({ backgroundColor: 'rgba(128, 64, 32, 50.19607843137255%)' });
	});

	it('renders full alpha correctly', () => {
		render(<ColorElement r={0} g={255} b={0} a={255} />);
		expect(screen.getByText(/100%/)).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(<ColorElement r={100} g={150} b={200} a={200} />);
		expect(container).toMatchSnapshot();
	});
});
