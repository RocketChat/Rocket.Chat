import { render, screen } from '@testing-library/react';

import PreviewColorElement from './PreviewColorElement';

describe('PreviewColorElement', () => {
	it('renders hex without alpha when a is 255', () => {
		render(<PreviewColorElement r={255} g={128} b={0} a={255} />);
		expect(screen.getByText(/ff8000/i)).toBeInTheDocument();
		expect(screen.queryByText(/ff8000ff/i)).not.toBeInTheDocument();
	});

	it('renders hex with alpha when a is not 255', () => {
		render(<PreviewColorElement r={255} g={0} b={0} a={128} />);
		expect(screen.getByText(/ff000080/i)).toBeInTheDocument();
	});

	it('pads single-digit hex values with leading zero', () => {
		render(<PreviewColorElement r={0} g={0} b={0} a={255} />);
		expect(screen.getByText(/000000/)).toBeInTheDocument();
	});

	it('renders full white correctly', () => {
		render(<PreviewColorElement r={255} g={255} b={255} a={255} />);
		expect(screen.getByText(/ffffff/i)).toBeInTheDocument();
	});

	it('renders with zero alpha', () => {
		render(<PreviewColorElement r={100} g={200} b={50} a={0} />);
		expect(screen.getByText(/64c83200/i)).toBeInTheDocument();
	});

	it('matches snapshot without alpha', () => {
		const { container } = render(<PreviewColorElement r={255} g={128} b={0} a={255} />);
		expect(container).toMatchSnapshot();
	});

	it('matches snapshot with alpha', () => {
		const { container } = render(<PreviewColorElement r={255} g={128} b={0} a={128} />);
		expect(container).toMatchSnapshot();
	});
});
