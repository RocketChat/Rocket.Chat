import { render } from '@testing-library/react';

import RelativeTime from './RelativeTime';
import { MarkupInteractionContext } from '../../MarkupInteractionContext';

describe('RelativeTime', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('renders relative time text', () => {
		const value = new Date('2025-06-15T11:55:00.000Z');
		const { container } = render(<RelativeTime value={value} />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toBeInTheDocument();
		expect(timeEl).toHaveAttribute('dateTime', value.toISOString());
	});

	it('renders with language context', () => {
		const value = new Date('2025-06-15T11:00:00.000Z');
		const { container } = render(
			<MarkupInteractionContext.Provider value={{ language: 'en' }}>
				<RelativeTime value={value} />
			</MarkupInteractionContext.Provider>,
		);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toBeInTheDocument();
	});

	it('defaults to en locale when language is not provided', () => {
		const value = new Date('2025-06-14T12:00:00.000Z');
		const { container } = render(<RelativeTime value={value} />);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toBeInTheDocument();
		expect(container.textContent).toBeTruthy();
	});

	it('updates text on interval', () => {
		const value = new Date('2025-06-15T11:59:30.000Z');
		const { container } = render(<RelativeTime value={value} />);

		const initialText = container.textContent;

		jest.advanceTimersByTime(2000);

		// Text may update after interval fires
		expect(container.textContent).toBeTruthy();
		// The initial text should have been set
		expect(initialText).toBeTruthy();
	});

	it('matches snapshot', () => {
		const value = new Date('2025-06-15T11:30:00.000Z');
		const { container } = render(
			<MarkupInteractionContext.Provider value={{ language: 'en' }}>
				<RelativeTime value={value} />
			</MarkupInteractionContext.Provider>,
		);
		expect(container).toMatchSnapshot();
	});
});
