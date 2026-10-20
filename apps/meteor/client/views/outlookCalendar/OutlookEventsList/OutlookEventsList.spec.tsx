import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import OutlookEventsList from './OutlookEventsList';

describe('OutlookEventsList', () => {
	it('shows only the error state when the events cannot be loaded', async () => {
		render(<OutlookEventsList onClose={jest.fn()} changeRoute={jest.fn()} />, {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/calendar-events.list', () => Promise.reject(new TypeError('Failed to fetch')))
				.build(),
		});

		expect(await screen.findByText('Something_went_wrong')).toBeInTheDocument();
		expect(screen.queryByText('No_history')).not.toBeInTheDocument();
	});

	it('shows only the empty state when there are no events', async () => {
		render(<OutlookEventsList onClose={jest.fn()} changeRoute={jest.fn()} />, {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/calendar-events.list', () => ({ data: [] }))
				.build(),
		});

		expect(await screen.findByText('No_history')).toBeInTheDocument();
		expect(screen.queryByText('Something_went_wrong')).not.toBeInTheDocument();
	});
});
