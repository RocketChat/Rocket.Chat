import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { createFakeSubscription } from '../../../../../tests/mocks/data';
import { emptyUnread, createMockGlobalStore } from '../../../../../tests/mocks/utils';
import { isUnreadSubscription } from '../../contexts/RoomsNavigationContext';

const fakeTeam = { ...createFakeSubscription({ alert: true }) };
const fakeChannel = { ...createFakeSubscription({ t: 'c', alert: true }) };

const teamChildChannel = {
	...createFakeSubscription({ t: 'c', ...emptyUnread, prid: fakeTeam.rid }),
};
const unreadTeamChildChannel = {
	...createFakeSubscription({ t: 'c', alert: true, prid: fakeTeam.rid }),
};
const childChannel = {
	...createFakeSubscription({ t: 'c', ...emptyUnread, prid: fakeChannel.rid }),
};
const userMentionsChildChannel = {
	...createFakeSubscription({ t: 'c', userMentions: 1, prid: fakeChannel.rid }),
};
const groupMentionsChildChannel = {
	...createFakeSubscription({ t: 'c', groupMentions: 1, prid: fakeChannel.rid }),
};
const unreadChildChannel = {
	...createFakeSubscription({ t: 'c', unread: 1, prid: fakeChannel.rid }),
};
const tUnreadChildChannel = {
	...createFakeSubscription({ t: 'c', tunread: ['1'], prid: fakeChannel.rid }),
};
const tUnreadUserChildChannel = {
	...createFakeSubscription({ t: 'c', tunreadUser: ['1'], prid: fakeChannel.rid }),
};
const tUnreadGroupChildChannel = {
	...createFakeSubscription({ t: 'c', tunreadGroup: ['1'], prid: fakeChannel.rid }),
};

const teamsSubscriptions = [fakeTeam, teamChildChannel, unreadTeamChildChannel] as unknown as SubscriptionWithRoom[];
const channelsSubscriptions = [
	fakeChannel,
	childChannel,
	userMentionsChildChannel,
	groupMentionsChildChannel,
	unreadChildChannel,
	tUnreadChildChannel,
	tUnreadUserChildChannel,
	tUnreadGroupChildChannel,
] as unknown as SubscriptionWithRoom[];

const subscriptionsMock = [...teamsSubscriptions, ...channelsSubscriptions] as unknown as SubscriptionWithRoom[];

jest.mock('../../../../stores/Subscriptions', () => {
	return {
		Subscriptions: createMockGlobalStore(subscriptionsMock),
	};
});

it('should return all subscriptions parent of fakeChannel', async () => {
	const { useChannelsChildrenList } = await import('./useChannelsChildrenList');

	const { result } = renderHook(() => useChannelsChildrenList(fakeChannel.rid, false), {
		wrapper: mockAppRoot().withSubscriptions(subscriptionsMock).build(),
	});

	expect(result.current).toHaveLength(channelsSubscriptions.length);
	expect(result.current[0].rid).toBe(fakeChannel.rid);

	if (result.current[0].rid === fakeChannel.rid) return;
	expect(result.current[0].prid).toBe(fakeChannel.rid);
});

it('should return unread subscriptions after parent but before read ones for channels', async () => {
	const { useChannelsChildrenList } = await import('./useChannelsChildrenList');

	const { result } = renderHook(() => useChannelsChildrenList(fakeChannel.rid, true), {
		wrapper: mockAppRoot().withSubscriptions(subscriptionsMock).build(),
	});

	expect(result.current).toHaveLength(channelsSubscriptions.length);
	expect(result.current[0].rid).toBe(fakeChannel.rid);

	expect(isUnreadSubscription(result.current[1])).toBe(true);
	expect(isUnreadSubscription(result.current[2])).toBe(true);
	expect(isUnreadSubscription(result.current[3])).toBe(true);
	expect(isUnreadSubscription(result.current[4])).toBe(true);
	expect(isUnreadSubscription(result.current[5])).toBe(true);
	expect(isUnreadSubscription(result.current[6])).toBe(true);

	expect(isUnreadSubscription(result.current[7])).toBe(false);

	if (result.current[0].rid === fakeChannel.rid) return;
	expect(result.current[0].prid).toBe(fakeChannel.rid);
});

it('should return subscriptions parent of fakeTeam', async () => {
	const { useChannelsChildrenList } = await import('./useChannelsChildrenList');

	const { result } = renderHook(() => useChannelsChildrenList(fakeTeam.rid, false), {
		wrapper: mockAppRoot().withSubscriptions(subscriptionsMock).build(),
	});

	expect(result.current).toHaveLength(teamsSubscriptions.length);
	expect(result.current[0].rid).toBe(fakeTeam.rid);

	if (result.current[0].rid === fakeTeam.rid) return;
	expect(result.current[0].prid).toBe(fakeTeam.rid);
});

it('should return unread subscriptions after parent but before read ones for teams', async () => {
	const { useChannelsChildrenList } = await import('./useChannelsChildrenList');

	const { result } = renderHook(() => useChannelsChildrenList(fakeTeam.rid, true), {
		wrapper: mockAppRoot().withSubscriptions(subscriptionsMock).build(),
	});

	expect(result.current).toHaveLength(teamsSubscriptions.length);
	expect(result.current[0].rid).toBe(fakeTeam.rid);

	expect(isUnreadSubscription(result.current[1])).toBe(true);
	expect(isUnreadSubscription(result.current[2])).toBe(false);

	if (result.current[0].rid === fakeTeam.rid) return;
	expect(result.current[0].prid).toBe(fakeTeam.rid);
});
