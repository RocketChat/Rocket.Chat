import { render, screen } from '@testing-library/react';

import Time from './Time';

describe('Time', () => {
	it('renders the value text', () => {
		render(<Time value='12:30 PM' dateTime='2025-01-15T12:30:00.000Z' />);
		expect(screen.getByText('12:30 PM')).toBeInTheDocument();
	});

	it('renders a time element with dateTime attribute', () => {
		render(<Time value='Jan 15, 2025' dateTime='2025-01-15T00:00:00.000Z' />);

		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Jan 15, 2025').closest('time')).toHaveAttribute('dateTime', '2025-01-15T00:00:00.000Z');
	});

	it('sets title to localized date string', () => {
		const date = new Date('2025-06-20T14:00:00.000Z');
		render(<Time value='some text' dateTime={date.toISOString()} />);

		// eslint-disable-next-line testing-library/no-node-access
		const timeEl = screen.getByText('some text').closest('time');
		expect(timeEl).toHaveAttribute('title', date.toLocaleString());
	});

	it('renders inline-block', () => {
		render(<Time value='test' dateTime='2025-01-01T00:00:00.000Z' />);

		// eslint-disable-next-line testing-library/no-node-access
		const timeEl = screen.getByText('test').closest('time');
		expect(timeEl).toHaveStyle({ display: 'inline-block' });
	});

	it('matches snapshot', () => {
		const { container } = render(<Time value='03/15/2025' dateTime='2025-03-15T00:00:00.000Z' />);
		expect(container).toMatchSnapshot();
	});
});
