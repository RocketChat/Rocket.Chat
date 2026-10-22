import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useScheduledMessagesRoomAction } from './useScheduledMessagesRoomAction';
import FakeRoomProvider from '../../../tests/mocks/client/FakeRoomProvider';

const appRoot = (rids: string[]) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('Message_Scheduling_Enabled', true)
		.withPermission('schedule-message')
		.withEndpoint('GET', '/v1/scheduledMessages.list', () => ({
			scheduledMessages: rids.map((rid, i) => ({
				_id: `s${i}`,
				rid,
				msg: 'm',
				scheduledAt: '2026-10-22T12:00:00.000Z',
				status: 'pending',
			})) as never,
			total: rids.length,
			offset: 0,
			count: rids.length,
		}))
		.wrap((children) => <FakeRoomProvider roomOverrides={{ _id: 'r1', t: 'c' }}>{children}</FakeRoomProvider>)
		.build();

describe('useScheduledMessagesRoomAction', () => {
	it('counts the scheduled messages of the room', async () => {
		const { result } = renderHook(() => useScheduledMessagesRoomAction(), { wrapper: appRoot(['r1', 'r1', 'r2']) });

		await waitFor(() => expect(result.current?.count).toBe(2));
	});
});
