import type { JoinableVideoConference } from '@rocket.chat/core-typings';

import type { ConferenceChatAccess, ConferenceMember } from './hooks/useConferenceEmbedded';

/**
 * The shapes the conference specs keep rebuilding, in one place — the server harness's counterpart on this side.
 *
 * Each of these was written out two or three times, which is two or three places to fix when a field moves.
 */

/** A call the reader could walk into. Present, not joined, not declined, unless said otherwise. */
export const buildJoinableCall = (
	overrides: Partial<JoinableVideoConference> & Pick<JoinableVideoConference, 'callId'>,
): JoinableVideoConference => ({
	name: `Call ${overrides.callId}`,
	createdAt: new Date('2026-08-03T10:00:00.000Z'),
	usersCount: 2,
	// As many faces as `usersCount` says are in it, so a fixture doesn't accidentally claim a "+N".
	participants: [
		{ _id: 'one', username: 'one', name: 'One' },
		{ _id: 'two', username: 'two', name: 'Two' },
	],
	joined: false,
	declined: false,
	...overrides,
});

/** A member of a call, as the call window holds them: joined and still in it, unless said otherwise. */
export const buildConferenceMember = (overrides: Partial<ConferenceMember> & Pick<ConferenceMember, '_id'>): ConferenceMember => ({
	username: overrides._id,
	name: `Name of ${overrides._id}`,
	...overrides,
});

/**
 * Where the chat lives and who can't read it. A public channel that can take new members, so both ways of
 * resolving the access are on the table unless a test narrows it.
 */
export const buildChatAccess = ({
	membersWithoutAccess = [],
	joined = true,
	...overrides
}: Partial<Omit<ConferenceChatAccess, 'members'>> & { joined?: boolean } = {}): ConferenceChatAccess => ({
	rid: 'room-id',
	name: 'general',
	type: 'c',
	canInvite: true,
	membersWithoutAccess,
	members: membersWithoutAccess.map((_id) => ({ _id, username: `user-${_id}`, name: `User ${_id}`, joined })),
	...overrides,
});
