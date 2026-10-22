import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, renderHook, screen, waitFor } from '@testing-library/react';

import { useAccountItems } from './useAccountItems';

const appRoot = (statuses: ('pending' | 'failed')[]) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('Message_Scheduling_Enabled', true)
		.withPermission('schedule-message')
		.withEndpoint('GET', '/v1/scheduledMessages.list', () => ({
			scheduledMessages: statuses.map((status, i) => ({
				_id: `s${i}`,
				rid: 'r',
				msg: 'm',
				status,
				scheduledAt: '2026-10-22T12:00:00.000Z',
			})) as never,
			total: statuses.length,
			offset: 0,
			count: statuses.length,
		}))
		.build();

const scheduledItem = (items: ReturnType<typeof useAccountItems>) => items.find(({ id }) => id === 'scheduled-messages');

describe('useAccountItems scheduled messages entry', () => {
	it('shows how many scheduled messages failed, so an offline author still finds out', async () => {
		const { result } = renderHook(() => useAccountItems(), { wrapper: appRoot(['pending', 'failed', 'failed']) });

		await waitFor(() => expect(scheduledItem(result.current)?.addon).toBeTruthy());
		render(<>{scheduledItem(result.current)?.addon}</>);

		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('shows no badge when nothing failed', async () => {
		const { result } = renderHook(() => useAccountItems(), { wrapper: appRoot(['pending']) });

		await waitFor(() => expect(scheduledItem(result.current)).toBeDefined());
		expect(scheduledItem(result.current)?.addon).toBeUndefined();
	});
});
