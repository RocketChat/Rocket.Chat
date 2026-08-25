// `BaseRaw` participates in a circular import that leaves it uninitialized when this module is loaded
// directly by jest. Only its constructor matters here, so it is stubbed out.
jest.mock('./BaseRaw', () => ({
	BaseRaw: class {
		constructor(
			public db: unknown,
			public name?: string,
		) {}
	},
}));

// eslint-disable-next-line import-x/first -- must be registered before the module under test is loaded
import { VideoConferenceRaw } from './VideoConference';

const member = { _id: 'user-1', username: 'user.one', name: 'User One', avatarETag: 'etag' };

/**
 * These assert the *shape* of the update sent to Mongo rather than its effect, which is the level the bug
 * these methods exist to prevent lives at: `$addToSet` on a whole document silently appends a second entry
 * once the first one has been mutated, and the guard that prevents it has to be in the query.
 */
const setupModel = () => {
	const updateOne = jest.fn().mockResolvedValue({});
	const model = new VideoConferenceRaw({ collection: () => ({}) } as never);
	Object.defineProperty(model, 'updateOne', { value: updateOne });

	return { model, updateOne };
};

describe('VideoConferenceRaw.addMemberById', () => {
	it('should guard on the member not already being present, in the query', async () => {
		const { model, updateOne } = setupModel();

		await model.addMemberById('call-1', member);

		const [query] = updateOne.mock.calls[0];
		expect(query).toEqual({ '_id': 'call-1', 'users._id': { $ne: 'user-1' } });
	});

	// `$addToSet` compares entire documents, so it stops de-duplicating the moment an entry can be mutated.
	it('should push rather than add-to-set', async () => {
		const { model, updateOne } = setupModel();

		await model.addMemberById('call-1', member);

		const [, update] = updateOne.mock.calls[0];
		expect(update).toHaveProperty('$push');
		expect(update).not.toHaveProperty('$addToSet');
	});

	it('should default a new member to not joined', async () => {
		const { model, updateOne } = setupModel();

		await model.addMemberById('call-1', member);

		expect(updateOne.mock.calls[0][1].$push.users).toMatchObject({ _id: 'user-1', joined: false });
	});

	it('should omit joinedAt when there is none, rather than storing undefined', async () => {
		const { model, updateOne } = setupModel();

		await model.addMemberById('call-1', member);

		expect(updateOne.mock.calls[0][1].$push.users).not.toHaveProperty('joinedAt');
	});
});

describe('VideoConferenceRaw.setUserJoinedById', () => {
	it('should mutate the matching entry in place via arrayFilters', async () => {
		const { model, updateOne } = setupModel();
		const joinedAt = new Date('2026-08-01T10:00:00Z');

		await model.setUserJoinedById('call-1', 'user-1', joinedAt);

		const [query, update, options] = updateOne.mock.calls[0];
		expect(query).toEqual({ _id: 'call-1' });
		expect(update.$set).toEqual({
			'users.$[user].joined': true,
			'users.$[user].joinedAt': joinedAt,
			'users.$[user].lastSeenAt': joinedAt,
		});
		expect(options).toEqual({ arrayFilters: [{ 'user._id': 'user-1' }] });
	});

	// An earlier departure left in place would report the member as gone while they're on the call, and could
	// end the call under them once presence is what decides that.
	it('should clear an earlier departure, since rejoining contradicts it', async () => {
		const { model, updateOne } = setupModel();

		await model.setUserJoinedById('call-1', 'user-1');

		expect(updateOne.mock.calls[0][1].$unset).toEqual({
			'users.$[user].leftAt': 1,
			'users.$[user].leftReason': 1,
			'users.$[user].ringingAt': 1,
		});
	});
});

describe('VideoConferenceRaw.renewUserPresenceById', () => {
	it('should stamp the lease on the matching entry via arrayFilters', async () => {
		const { model, updateOne } = setupModel();
		const lastSeenAt = new Date('2026-08-01T10:00:00Z');

		await model.renewUserPresenceById('call-1', 'user-1', lastSeenAt);

		const [, update, options] = updateOne.mock.calls[0];
		expect(update.$set).toEqual({ 'users.$[user].lastSeenAt': lastSeenAt });
		expect(options).toEqual({ arrayFilters: [{ 'user._id': 'user-1' }] });
	});

	// A lease we gave up on while the window was in fact alive was simply wrong, and the window still talking to
	// us is the correction — otherwise a member evicted during an outage would stay evicted for the whole call.
	it('should undo a departure that was only inferred', async () => {
		const { model, updateOne } = setupModel();

		await model.renewUserPresenceById('call-1', 'user-1');

		expect(updateOne.mock.calls[0][1].$unset).toEqual({ 'users.$[user].leftAt': 1, 'users.$[user].leftReason': 1 });
	});

	// The guard has to be in the query, because that is the only part of an update that can be conditional: a
	// heartbeat still in flight behind someone who chose to leave must not put them back in the call.
	it('should refuse to revive a member who reported leaving, in the query', async () => {
		const { model, updateOne } = setupModel();

		await model.renewUserPresenceById('call-1', 'user-1', new Date(), ['timeout']);

		const [query] = updateOne.mock.calls[0];
		expect(query).toEqual({
			_id: 'call-1',
			users: { $elemMatch: { _id: 'user-1', $or: [{ leftAt: { $exists: false } }, { leftReason: { $in: ['timeout'] } }] } },
		});
	});
});

describe('VideoConferenceRaw.renewUsersPresenceById', () => {
	it('should stamp every named member at once', async () => {
		const { model, updateOne } = setupModel();
		const lastSeenAt = new Date('2026-08-01T10:00:00Z');

		await model.renewUsersPresenceById('call-1', ['user-1', 'user-2'], lastSeenAt);

		const [, update, options] = updateOne.mock.calls[0];
		expect(update).toEqual({ $set: { 'users.$[user].lastSeenAt': lastSeenAt } });
		expect(options).toEqual({ arrayFilters: [{ 'user._id': { $in: ['user-1', 'user-2'] } }] });
	});

	// Unlike a member's own heartbeat, a provider reporting its room says nothing about whether an inferred
	// departure was wrong — and an update with no ids would match every member of the call.
	it('should leave departures alone, and do nothing at all with nobody to renew', async () => {
		const { model, updateOne } = setupModel();

		await model.renewUsersPresenceById('call-1', [], new Date());
		expect(updateOne).not.toHaveBeenCalled();

		await model.renewUsersPresenceById('call-1', ['user-1'], new Date());
		expect(updateOne.mock.calls[0][1]).not.toHaveProperty('$unset');
	});
});

describe('VideoConferenceRaw.setUserLeftById', () => {
	it('should mutate the matching entry in place via arrayFilters', async () => {
		const { model, updateOne } = setupModel();
		const leftAt = new Date('2026-08-01T10:00:00Z');

		await model.setUserLeftById('call-1', 'user-1', leftAt);

		const [query, update, options] = updateOne.mock.calls[0];
		expect(query).toEqual({ _id: 'call-1' });
		expect(update.$set).toEqual({ 'users.$[user].leftAt': leftAt });
		expect(options).toEqual({ arrayFilters: [{ 'user._id': 'user-1' }] });
	});

	// Leaving is not un-joining: the member keeps their place in the call's history and can rejoin.
	it('should leave joined and declined alone', async () => {
		const { model, updateOne } = setupModel();

		await model.setUserLeftById('call-1', 'user-1');

		const keys = Object.keys(updateOne.mock.calls[0][1].$set);
		expect(keys).toEqual(['users.$[user].leftAt']);
	});

	// How the departure was learned is only worth writing when there is something to say. An absent reason reads
	// as reported, which is what every entry written before presence leases existed was.
	it('should record how the departure was learned, only when told', async () => {
		const { model, updateOne } = setupModel();

		// `toHaveProperty` reads a dotted string as a path, and every key here is a dotted Mongo field.
		await model.setUserLeftById('call-1', 'user-1', new Date(), 'timeout');
		expect(updateOne.mock.calls[0][1].$set['users.$[user].leftReason']).toBe('timeout');

		await model.setUserLeftById('call-1', 'user-1', new Date());
		expect(Object.keys(updateOne.mock.calls[1][1].$set)).not.toContain('users.$[user].leftReason');
	});

	// A reported departure has to erase a leftover inferred one, or a stale heartbeat could still revive it:
	// `renewUserPresenceById` treats an inferred reason as permission to undo the departure.
	it('should clear a previously inferred reason when the departure is reported', async () => {
		const { model, updateOne } = setupModel();

		await model.setUserLeftById('call-1', 'user-1', new Date());
		expect(updateOne.mock.calls[0][1].$unset).toEqual({ 'users.$[user].leftReason': 1 });

		await model.setUserLeftById('call-1', 'user-1', new Date(), 'timeout');
		expect(updateOne.mock.calls[1][1]).not.toHaveProperty('$unset');
	});
});

describe('VideoConferenceRaw.addEmbeddedParticipant', () => {
	// Two writes ($pull then $push) let two concurrent joins interleave into a duplicate entry; a single
	// pipeline update replaces-and-appends atomically.
	it('should drop any prior entry and append the fresh one in one write', async () => {
		const { model, updateOne } = setupModel();
		const joinedAt = new Date('2026-08-01T10:00:00Z');

		await model.addEmbeddedParticipant('call-1', { id: 'user-1', username: 'user.one', displayName: 'User One', joinedAt });

		expect(updateOne).toHaveBeenCalledTimes(1);
		const [query, update] = updateOne.mock.calls[0];
		expect(query).toEqual({ _id: 'call-1' });
		// A pipeline update, which is what makes the replace-and-append a single atomic step.
		expect(Array.isArray(update)).toBe(true);
		expect(update[0].$set.participants.$concatArrays[1]).toEqual({
			$literal: [{ id: 'user-1', username: 'user.one', displayName: 'User One', joinedAt }],
		});
	});
});

describe('VideoConferenceRaw.setUserDeclinedById', () => {
	it('should mutate the matching entry in place via arrayFilters', async () => {
		const { model, updateOne } = setupModel();
		const declinedAt = new Date('2026-08-01T10:00:00Z');

		await model.setUserDeclinedById('call-1', 'user-1', declinedAt);

		const [query, update, options] = updateOne.mock.calls[0];
		expect(query).toEqual({ _id: 'call-1' });
		expect(update).toEqual({ $set: { 'users.$[user].declined': true, 'users.$[user].declinedAt': declinedAt } });
		expect(options).toEqual({ arrayFilters: [{ 'user._id': 'user-1' }] });
	});

	// Declining must not clear `joined`: a member can dismiss the ring and join later.
	it('should not touch the joined flag', async () => {
		const { model, updateOne } = setupModel();

		await model.setUserDeclinedById('call-1', 'user-1');

		expect(Object.keys(updateOne.mock.calls[0][1].$set)).not.toContain('users.$[user].joined');
	});
});
