import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { FIXTURE_EPOCH, nextFixtureId } from './sequence';

export const createFakeSubscription = (overrides?: Partial<SubscriptionWithRoom>): SubscriptionWithRoom =>
	({
		_id: nextFixtureId('subscription'),
		_updatedAt: FIXTURE_EPOCH,
		rid: nextFixtureId('room'),
		open: true,
		ts: FIXTURE_EPOCH,
		name: 'general',
		lowerCaseName: 'general',
		lowerCaseFName: 'general',
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
		t: 'c',
		ls: FIXTURE_EPOCH,
		lr: FIXTURE_EPOCH,
		...overrides,
		u: {
			_id: 'viewer',
			username: 'viewer',
			name: 'Viewer',
			...overrides?.u,
		},
	}) as SubscriptionWithRoom;
