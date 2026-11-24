import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useMemberHistoryVisibleFrom } from './useMemberHistoryVisibleFrom';
import { createFakeRoom } from '../../../../tests/mocks/data';

const room = createFakeRoom({ _id: 'room-id', t: 'c' });

const member = (username: string, historyVisibleFrom?: string) => ({
	_id: `${username}-id`,
	username,
	subscription: { _id: `${username}-sub`, ts: '2026-10-01T00:00:00.000Z', ...(historyVisibleFrom && { historyVisibleFrom }) },
});

const appRoot = (members: ReturnType<typeof member>[]) => {
	const getMembers = jest.fn().mockResolvedValue({ members, total: members.length, count: members.length, offset: 0 });
	const root = mockAppRoot()
		.withRoom(room)
		.withSetting('Restricted_Message_History_Enabled', true)
		.withPermission('add-user-to-joined-room')
		.withEndpoint('GET', '/v1/rooms.membersOrderedByRole', getMembers);

	return { root, getMembers };
};

describe('useMemberHistoryVisibleFrom', () => {
	it("returns the member's cutoff", async () => {
		const { root } = appRoot([member('alice', '2026-11-16T14:30:00.000Z')]);

		const { result } = renderHook(() => useMemberHistoryVisibleFrom(room._id, 'alice'), { wrapper: root.build() });

		await waitFor(() => expect(result.current).toBe('2026-11-16T14:30:00.000Z'));
	});

	it('returns null for a member who sees the full history', async () => {
		const { root } = appRoot([member('alice')]);

		const { result } = renderHook(() => useMemberHistoryVisibleFrom(room._id, 'alice'), { wrapper: root.build() });

		await waitFor(() => expect(result.current).toBeNull());
	});

	it('reads the member whose username matches exactly, not one that only contains it', async () => {
		const { root } = appRoot([member('alice.smith', '2026-11-16T14:30:00.000Z'), member('alice')]);

		const { result } = renderHook(() => useMemberHistoryVisibleFrom(room._id, 'alice'), { wrapper: root.build() });

		await waitFor(() => expect(result.current).toBeNull());
	});

	it("doesn't ask for anything when the user can't manage the member's history", () => {
		const getMembers = jest.fn();
		const root = mockAppRoot()
			.withRoom(room)
			.withSetting('Restricted_Message_History_Enabled', true)
			.withEndpoint('GET', '/v1/rooms.membersOrderedByRole', getMembers);

		const { result } = renderHook(() => useMemberHistoryVisibleFrom(room._id, 'alice'), { wrapper: root.build() });

		expect(result.current).toBeUndefined();
		expect(getMembers).not.toHaveBeenCalled();
	});
});
