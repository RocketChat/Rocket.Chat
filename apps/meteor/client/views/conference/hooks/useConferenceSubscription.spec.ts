import type { StreamControllerRef } from '@rocket.chat/mock-providers';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { shouldApplySubscriptionChange, useConferenceSubscription } from './useConferenceSubscription';
import { SubscriptionsCachedStore } from '../../../cachedStores';

const rid = 'room-id';

const subscription = { _id: 'sub-id', rid, u: { _id: 'john.doe' }, unread: 4, ts: '2026-08-03T10:00:00.000Z' };

const getOne = jest.fn(() => ({ subscription, success: true }) as any);

const upsert = jest.spyOn(SubscriptionsCachedStore, 'upsertSubscription').mockResolvedValue(undefined);

const render = (roomId: string | undefined) => {
	const streamRef: StreamControllerRef<'notify-user'> = {};

	const result = renderHook(() => useConferenceSubscription(roomId), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withStream('notify-user', streamRef)
			.withEndpoint('GET', '/v1/subscriptions.getOne', getOne)
			.build(),
	});

	return { ...result, streamRef };
};

beforeEach(() => {
	getOne.mockClear();
	upsert.mockClear();
});

// The unread badge on the *closed* chat needs this, and the panel that used to own it isn't mounted then.
it('puts the conference chat subscription in the store', async () => {
	render(rid);

	await waitFor(() => expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ rid, unread: 4 })));
});

it('asks for nothing until there is a room to ask about', () => {
	render(undefined);

	expect(getOne).not.toHaveBeenCalled();
});

// The conference renders outside the main app, so the sidebar's own subscription watcher never starts. Without
// this listener unread counts would be frozen at whatever they were when the page loaded.
it("follows the user's own subscription changes", () => {
	const { streamRef } = render(rid);

	expect(streamRef.controller?.has('john.doe/subscriptions-changed')).toBe(true);
});

// What that listener does with each change. Driven directly, because the mocked stream can only deliver a
// single callback argument and this callback takes two.
describe('shouldApplySubscriptionChange', () => {
	it('applies a change to this room', () => {
		expect(shouldApplySubscriptionChange('changed', rid, rid)).toBe(true);
	});

	it('ignores a change to another room', () => {
		expect(shouldApplySubscriptionChange('changed', 'elsewhere', rid)).toBe(false);
	});

	// A removal is the room going away from under them, not an update to fold in.
	it('ignores a removal', () => {
		expect(shouldApplySubscriptionChange('removed', rid, rid)).toBe(false);
	});

	it('ignores a change that says nothing about which room it is', () => {
		expect(shouldApplySubscriptionChange('changed', undefined, rid)).toBe(false);
	});
});
