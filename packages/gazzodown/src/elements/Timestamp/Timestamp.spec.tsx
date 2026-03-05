import { render } from '@testing-library/react';

import Timestamp from './Timestamp';

describe('Timestamp', () => {
	const date = new Date('2025-06-15T14:30:45.000Z');

	it('renders ShortTime for format "t"', () => {
		const { container } = render(<Timestamp format='t' value={date} />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('renders LongTime for format "T"', () => {
		const { container } = render(<Timestamp format='T' value={date} />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('renders ShortDate for format "d"', () => {
		const { container } = render(<Timestamp format='d' value={date} />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('renders LongDate for format "D"', () => {
		const { container } = render(<Timestamp format='D' value={date} />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('renders FullDate for format "f"', () => {
		const { container } = render(<Timestamp format='f' value={date} />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('renders FullDateLong for format "F"', () => {
		const { container } = render(<Timestamp format='F' value={date} />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());
	});

	it('renders RelativeTime for format "R"', () => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2025-06-15T15:00:00.000Z'));

		const { container } = render(<Timestamp format='R' value={date} />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toHaveAttribute('dateTime', date.toISOString());

		jest.useRealTimers();
	});

	it('produces different outputs for different formats', () => {
		const { container: shortTime } = render(<Timestamp format='t' value={date} />);
		const { container: longDate } = render(<Timestamp format='D' value={date} />);

		expect(shortTime.textContent).not.toBe(longDate.textContent);
	});

	it('matches snapshot for format "f"', () => {
		const { container } = render(<Timestamp format='f' value={date} />);
		expect(container).toMatchSnapshot();
	});
});
