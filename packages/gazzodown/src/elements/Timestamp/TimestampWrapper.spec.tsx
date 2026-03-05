import { render } from '@testing-library/react';

import TimestampWrapper from './TimestampWrapper';

describe('TimestampWrapper', () => {
	it('renders Timestamp with parsed date and format', () => {
		const timestamp = {
			type: 'TIMESTAMP' as const,
			value: { timestamp: '1718457045', format: 'f' as const },
		};

		const { container } = render(<TimestampWrapper>{timestamp}</TimestampWrapper>);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toBeInTheDocument();
		expect(timeEl).toHaveAttribute('dateTime', new Date(1718457045 * 1000).toISOString());
	});

	it('renders short time format', () => {
		const timestamp = {
			type: 'TIMESTAMP' as const,
			value: { timestamp: '1718457045', format: 't' as const },
		};

		const { container } = render(<TimestampWrapper>{timestamp}</TimestampWrapper>);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const timeEl = container.querySelector('time');
		expect(timeEl).toBeInTheDocument();
	});

	it('renders fallback when child throws', () => {
		jest.spyOn(console, 'error').mockImplementation(() => undefined);

		const timestamp = {
			type: 'TIMESTAMP' as const,
			value: { timestamp: 'not-a-number', format: 'f' as const },
		};

		const { container } = render(<TimestampWrapper>{timestamp}</TimestampWrapper>);

		// ErrorBoundary should render the fallback (UTC string of invalid date or error)
		expect(container.textContent).toBeTruthy();

		jest.restoreAllMocks();
	});

	it('matches snapshot', () => {
		const timestamp = {
			type: 'TIMESTAMP' as const,
			value: { timestamp: '1718457045', format: 'D' as const },
		};

		const { container } = render(<TimestampWrapper>{timestamp}</TimestampWrapper>);
		expect(container).toMatchSnapshot();
	});
});
