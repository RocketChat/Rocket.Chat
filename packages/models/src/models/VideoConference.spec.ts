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

// oxlint-disable-next-line import-x/first -- must be registered before the module under test is loaded
import { VideoConferenceRaw } from './VideoConference';

const member = { _id: 'user-1', username: 'user.one', name: 'User One', avatarETag: 'etag' };

/**
 * These assert the *shape* of the update sent to Mongo rather than its effect, which is the level the bug
 * these methods exist to prevent lives at: `$addToSet` on a whole document silently appends a second entry
 * once the first one has been mutated, and the guard that prevents it has to be in the query.
 */
const setupModel = () => {
	const updateOne = jest.fn().mockResolvedValue({});
	const findOneAndUpdate = jest.fn().mockResolvedValue(null);
	const model = new VideoConferenceRaw({ collection: () => ({}) } as never);
	Object.defineProperty(model, 'updateOne', { value: updateOne });
	Object.defineProperty(model, 'findOneAndUpdate', { value: findOneAndUpdate });

	return { model, updateOne, findOneAndUpdate };
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
	it('should stamp the lease on the matching entry via arrayFilters, reading the entry as it stood before', async () => {
		const { model, findOneAndUpdate } = setupModel();
		const lastSeenAt = new Date('2026-08-01T10:00:00Z');

		await model.renewUserPresenceById('call-1', 'user-1', lastSeenAt);

		const [, update, options] = findOneAndUpdate.mock.calls[0];
		expect(update.$set).toEqual({ 'users.$[user].lastSeenAt': lastSeenAt });
		expect(options).toMatchObject({ arrayFilters: [{ 'user._id': 'user-1' }], returnDocument: 'before' });
	});

	// A lease we gave up on while the window was in fact alive was simply wrong, and the window still talking to
	// us is the correction — otherwise a member evicted during an outage would stay evicted for the whole call.
	it('should undo a departure that was only inferred', async () => {
		const { model, findOneAndUpdate } = setupModel();

		await model.renewUserPresenceById('call-1', 'user-1');

		expect(findOneAndUpdate.mock.calls[0][1].$unset).toEqual({ 'users.$[user].leftAt': 1, 'users.$[user].leftReason': 1 });
	});

	// The guards have to be in the query, because that is the only part of an update that can be conditional: a
	// heartbeat still in flight behind someone who chose to leave must not put them back in the call, and the
	// final heartbeat of a window whose lease expiry ended the call must not regenerate a member inside an ENDED
	// conference.
	it('should refuse a reported leave and an ended call, in the query', async () => {
		const { model, findOneAndUpdate } = setupModel();

		await model.renewUserPresenceById('call-1', 'user-1', new Date(), ['timeout']);

		const [query] = findOneAndUpdate.mock.calls[0];
		expect(query).toEqual({
			_id: 'call-1',
			endedAt: { $exists: false },
			users: { $elemMatch: { _id: 'user-1', $or: [{ leftAt: { $exists: false } }, { leftReason: { $in: ['timeout'] } }] } },
		});
	});

	// The answer is decided in the same atomic step as the write: what the entry said *before* the renewal
	// cleared it is the only evidence of whether anything was revived.
	it('should report a revival from the before-document, and null when nothing matched', async () => {
		const { model, findOneAndUpdate } = setupModel();

		findOneAndUpdate.mockResolvedValueOnce({
			rid: 'room-1',
			providerName: 'test',
			users: [{ _id: 'user-1', leftAt: new Date('2026-08-01T10:00:00Z'), leftReason: 'timeout' }],
		});
		expect(await model.renewUserPresenceById('call-1', 'user-1')).toEqual({ revived: true, rid: 'room-1', providerName: 'test' });

		findOneAndUpdate.mockResolvedValueOnce({ rid: 'room-1', providerName: 'test', users: [{ _id: 'user-1' }] });
		expect(await model.renewUserPresenceById('call-1', 'user-1')).toEqual({ revived: false, rid: 'room-1', providerName: 'test' });

		findOneAndUpdate.mockResolvedValueOnce(null);
		expect(await model.renewUserPresenceById('call-1', 'user-1')).toBeNull();
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

const LIVE = { $in: [0, 1] };

const setupFinders = () => {
	const findOne = jest.fn().mockResolvedValue(null);
	const find = jest.fn().mockReturnValue({});
	const insertOne = jest.fn().mockResolvedValue({ insertedId: 'call-1' });
	const model = new VideoConferenceRaw({ collection: () => ({}) } as never);
	Object.defineProperty(model, 'findOne', { value: findOne });
	Object.defineProperty(model, 'find', { value: find });
	Object.defineProperty(model, 'insertOne', { value: insertOne });

	return { model, findOne, find, insertOne };
};

describe('VideoConferenceRaw live conferences of a link', () => {
	// The unique partial index is the only thing standing between two concurrent starts from one link and two
	// conferences: the loser's insert fails with a duplicate key. A conference without a link stays out of it.
	it('indexes', () => {
		const { model } = setupFinders();
		const indexes = (model as unknown as { modelIndexes: () => { key: object }[] }).modelIndexes();
		const live = { conferenceRoomId: { $exists: true }, status: LIVE };

		expect(indexes).toHaveLength(6);
		expect(indexes.slice(0, 4).map(({ key }) => key)).toEqual([
			{ rid: 1, createdAt: 1 },
			{ type: 1, status: 1 },
			{ discussionRid: 1, createdAt: 1 },
			{ status: 1, createdAt: -1 },
		]);
		expect(indexes[4]).toEqual({ key: { conferenceRoomId: 1 }, unique: true, partialFilterExpression: live });
		expect(indexes[5]).toEqual({ key: { customUrl: 1 }, unique: false, partialFilterExpression: live });
	});

	// The `{ customUrl: 1 }` index is partial on linked conferences, so the query must name that too.
	it('findOneActiveByCustomUrl names the live statuses and linked conferences', async () => {
		const { model, findOne } = setupFinders();

		await model.findOneActiveByCustomUrl('weekly', { projection: { _id: 1 } });

		expect(findOne).toHaveBeenCalledWith(
			{ customUrl: 'weekly', conferenceRoomId: { $exists: true }, status: LIVE },
			{ projection: { _id: 1 } },
		);
	});

	it('findOneActiveByConferenceRoomId names the live statuses', async () => {
		const { model, findOne } = setupFinders();

		await model.findOneActiveByConferenceRoomId('link-1');

		expect(findOne).toHaveBeenCalledWith({ conferenceRoomId: 'link-1', status: LIVE }, undefined);
	});

	it('findActiveByConferenceRoomIds names the live statuses', () => {
		const { model, find } = setupFinders();

		model.findActiveByConferenceRoomIds(['link-1', 'link-2'], { projection: { conferenceRoomId: 1 } });

		expect(find).toHaveBeenCalledWith(
			{ conferenceRoomId: { $in: ['link-1', 'link-2'] }, status: LIVE },
			{ projection: { conferenceRoomId: 1 } },
		);
	});

	it('findActiveCustomUrlsStartingWith matches an anchored, literal prefix among live conferences', () => {
		const { model, find } = setupFinders();

		model.findActiveCustomUrlsStartingWith('a.b+');

		const [filter] = find.mock.calls[0];
		expect(filter.status).toEqual(LIVE);
		// The `{ customUrl: 1 }` index is partial on linked conferences, so the query must name that too.
		expect(filter.conferenceRoomId).toEqual({ $exists: true });
		const pattern = new RegExp(filter.customUrl.$regex);
		expect(pattern.test('a.b+-2')).toBe(true);
		expect(pattern.test('axbb')).toBe(false);
		expect(pattern.test('xa.b+')).toBe(false);
	});
});

describe('VideoConferenceRaw.createGroup', () => {
	const details = {
		rid: 'room-1',
		title: 'Weekly',
		createdBy: { _id: 'u', name: 'U', username: 'u' },
		providerName: 'LiveKit',
		ringing: false,
	};

	it('createGroup stores both fields', async () => {
		const { model, insertOne } = setupFinders();

		await model.createGroup({ ...details, conferenceRoomId: 'link-1', customUrl: 'weekly' });

		expect(insertOne.mock.calls[0][0]).toMatchObject({ conferenceRoomId: 'link-1', customUrl: 'weekly', providerName: 'livekit' });
	});

	// Without `ignoreUndefined` the driver stores `undefined` as `null`, and `$exists` matches `null`: every
	// conference without a link would then collide in the unique link index.
	it('createGroup leaves undefined fields out', async () => {
		const { model, insertOne } = setupFinders();

		await model.createGroup({ ...details, conferenceRoomId: undefined, customUrl: undefined });
		await model.createGroup(details);

		for (const [doc] of insertOne.mock.calls) {
			expect(Object.keys(doc)).not.toContain('conferenceRoomId');
			expect(Object.keys(doc)).not.toContain('customUrl');
		}
	});
});
