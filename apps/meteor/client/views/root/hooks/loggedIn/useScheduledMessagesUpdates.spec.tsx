import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { StreamControllerRef } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useScheduledMessagesUpdates } from './useScheduledMessagesUpdates';

describe('useScheduledMessagesUpdates', () => {
	it('reloads the scheduled messages of the user when the server signals a change', async () => {
		const list = jest.fn(() => ({ scheduledMessages: [], total: 0, offset: 0, count: 0 }));
		const streamRef: StreamControllerRef<'notify-user'> = {};
		renderHook(() => useScheduledMessagesUpdates(), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withSetting('Message_Scheduling_Enabled', true)
				.withPermission('schedule-message')
				.withExperimentalEndpoint('GET', '/experimental/scheduledMessages.list', list)
				.withStream('notify-user', streamRef)
				.build(),
		});
		await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

		act(() => streamRef.controller?.emit('john.doe/scheduled-messages', []));

		await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
	});
});
