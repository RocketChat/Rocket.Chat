import { render } from '@testing-library/react';

import FullDate from './FullDate';
import FullDateLong from './FullDateLong';
import LongDate from './LongDate';
import LongTime from './LongTime';
import ShortDate from './ShortDate';
import ShortTime from './ShortTime';

describe('ShortTime', () => {
	it('renders short time format', () => {
		const date = new Date('2025-06-15T14:30:00.000Z');
		render(<ShortTime value={date} />);

		// eslint-disable-next-line testing-library/no-node-access
		const timeEl = document.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('matches snapshot', () => {
		const { container } = render(<ShortTime value={new Date('2025-01-15T08:05:00.000Z')} />);
		expect(container).toMatchSnapshot();
	});
});

describe('LongTime', () => {
	it('renders long time format', () => {
		const date = new Date('2025-06-15T14:30:45.000Z');
		render(<LongTime value={date} />);

		// eslint-disable-next-line testing-library/no-node-access
		const timeEl = document.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('matches snapshot', () => {
		const { container } = render(<LongTime value={new Date('2025-01-15T08:05:30.000Z')} />);
		expect(container).toMatchSnapshot();
	});
});

describe('ShortDate', () => {
	it('renders short date format', () => {
		const date = new Date('2025-06-15T00:00:00.000Z');
		render(<ShortDate value={date} />);

		// eslint-disable-next-line testing-library/no-node-access
		const timeEl = document.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('matches snapshot', () => {
		const { container } = render(<ShortDate value={new Date('2025-03-20T00:00:00.000Z')} />);
		expect(container).toMatchSnapshot();
	});
});

describe('LongDate', () => {
	it('renders long date format', () => {
		const date = new Date('2025-06-15T14:30:00.000Z');
		render(<LongDate value={date} />);

		// eslint-disable-next-line testing-library/no-node-access
		const timeEl = document.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('matches snapshot', () => {
		const { container } = render(<LongDate value={new Date('2025-03-20T10:15:00.000Z')} />);
		expect(container).toMatchSnapshot();
	});
});

describe('FullDate', () => {
	it('renders full date and time format', () => {
		const date = new Date('2025-06-15T14:30:00.000Z');
		render(<FullDate value={date} />);

		// eslint-disable-next-line testing-library/no-node-access
		const timeEl = document.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('matches snapshot', () => {
		const { container } = render(<FullDate value={new Date('2025-03-20T10:15:30.000Z')} />);
		expect(container).toMatchSnapshot();
	});
});

describe('FullDateLong', () => {
	it('renders full date and time long format', () => {
		const date = new Date('2025-06-15T14:30:00.000Z');
		render(<FullDateLong value={date} />);

		// eslint-disable-next-line testing-library/no-node-access
		const timeEl = document.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('matches snapshot', () => {
		const { container } = render(<FullDateLong value={new Date('2025-03-20T10:15:30.000Z')} />);
		expect(container).toMatchSnapshot();
	});
});
