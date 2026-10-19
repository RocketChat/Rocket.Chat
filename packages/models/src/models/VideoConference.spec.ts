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
import { VideoConferenceStatus } from '@rocket.chat/core-typings';

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

describe('VideoConferenceRaw SIP alias', () => {
	// The alias is released so its (eight-digit) space can be reused, and every write that finishes a call has
	// to do it — a call left holding an alias keeps a number nobody can dial back out of the pool.
	it.each([
		{ label: 'expired', status: VideoConferenceStatus.EXPIRED },
		{ label: 'ended', status: VideoConferenceStatus.ENDED },
		{ label: 'declined', status: VideoConferenceStatus.DECLINED },
	])('should release the alias when setStatusById marks the call $label', async ({ status }) => {
		const { model, updateOne } = setupModel();

		await model.setStatusById('call-1', status);

		expect(updateOne.mock.calls[0][1]).toEqual({ $set: { status }, $unset: { sipAlias: true } });
	});

	it.each([
		{ label: 'calling', status: VideoConferenceStatus.CALLING },
		{ label: 'started', status: VideoConferenceStatus.STARTED },
	])('should keep the alias when setStatusById marks the call $label', async ({ status }) => {
		const { model, updateOne } = setupModel();

		await model.setStatusById('call-1', status);

		expect(updateOne.mock.calls[0][1]).not.toHaveProperty('$unset');
	});

	it('should release the alias when setDataById carries a finishing status', async () => {
		const { model, updateOne } = setupModel();

		await model.setDataById('call-1', { status: VideoConferenceStatus.ENDED, endedAt: new Date() });

		expect(updateOne.mock.calls[0][1].$unset).toEqual({ sipAlias: true });
	});

	// A partial update that names no status says nothing about whether the call is over, so it must leave the
	// alias alone rather than reading "no status" as "not finished" either way.
	it('should leave the alias alone when setDataById carries no status', async () => {
		const { model, updateOne } = setupModel();

		await model.setDataById('call-1', { ringing: false });

		expect(updateOne.mock.calls[0][1]).not.toHaveProperty('$unset');
	});

	it('should release the alias when the call is ended', async () => {
		const { model, updateOne } = setupModel();

		await model.setEndedById('call-1');

		expect(updateOne.mock.calls[0][1].$unset).toEqual({ sipAlias: true });
	});

	it('should look an alias up scoped by provider, since it is only unique within one', async () => {
		const { model } = setupModel();
		const findOne = jest.fn().mockResolvedValue(null);
		Object.defineProperty(model, 'findOne', { value: findOne });

		await model.findOneByProviderNameAndSipAlias('core.pexip', '12345678');

		expect(findOne.mock.calls[0][0]).toEqual({ providerName: 'core.pexip', sipAlias: '12345678' });
	});

	// A SIP participant event carries the alias it dialled and nothing else, so the count is addressed by it.
	it('should count a SIP participant by alias and hand back the updated call', async () => {
		const { model, findOneAndUpdate } = setupModel();

		await model.increaseSipParticipantCount('12345678');

		const [query, update, options] = findOneAndUpdate.mock.calls[0];
		expect(query).toEqual({ sipAlias: '12345678' });
		expect(update).toEqual({ $inc: { sipParticipantCount: 1 } });
		expect(options).toEqual({ returnDocument: 'after' });
	});

	it('should count a WebRTC participant by call id', async () => {
		const { model, findOneAndUpdate } = setupModel();

		await model.increaseWebRTCParticipantCount('call-1');

		const [query, update] = findOneAndUpdate.mock.calls[0];
		expect(query).toEqual({ _id: 'call-1' });
		expect(update).toEqual({ $inc: { webrtcParticipantCount: 1 } });
	});
});

describe('VideoConferenceRaw.createGroup', () => {
	// The alias index is partial on the field existing, and the driver writes an explicit `undefined` as
	// `null` — which exists. Assigning it unconditionally would collide every aliasless conference with the last.
	it('should omit sipAlias and discussionRid entirely when it has neither', async () => {
		const { model } = setupModel();
		const insertOne = jest.fn().mockResolvedValue({ insertedId: 'call-1' });
		Object.defineProperty(model, 'insertOne', { value: insertOne });

		await model.createGroup({
			rid: 'room-1',
			title: 'Call',
			createdBy: member,
			providerName: 'core.pexip',
			ringing: false,
		});

		const [doc] = insertOne.mock.calls[0];
		expect(doc).not.toHaveProperty('sipAlias');
		expect(doc).not.toHaveProperty('discussionRid');
	});

	it('should carry sipAlias and discussionRid when given', async () => {
		const { model } = setupModel();
		const insertOne = jest.fn().mockResolvedValue({ insertedId: 'call-1' });
		Object.defineProperty(model, 'insertOne', { value: insertOne });

		await model.createGroup({
			rid: 'room-1',
			title: 'Call',
			createdBy: member,
			providerName: 'core.pexip',
			ringing: false,
			sipAlias: '12345678',
			discussionRid: 'discussion-1',
		});

		const [doc] = insertOne.mock.calls[0];
		expect(doc.sipAlias).toBe('12345678');
		expect(doc.discussionRid).toBe('discussion-1');
	});
});

describe('VideoConferenceRaw.findPaginatedByRoomId', () => {
	const setupAggregation = () => {
		const aggregate = jest.fn().mockReturnValue({});
		const countDocuments = jest.fn().mockResolvedValue(0);
		const model = new VideoConferenceRaw({ collection: () => ({}) } as never);
		Object.defineProperty(model, 'col', { value: { aggregate, countDocuments } });

		return { model, aggregate, countDocuments };
	};

	const stageNames = (pipeline: object[]) => pipeline.map((stage) => Object.keys(stage)[0]);

	// A discussion has to resolve the conference it belongs to: its members may have no access to the parent
	// room the call started in, so matching on `rid` alone would hide their own call from them.
	it('should match conferences started in the room and those whose discussion is the room', async () => {
		const { model, aggregate, countDocuments } = setupAggregation();

		model.findPaginatedByRoomId('room-1');

		const expected = { $or: [{ rid: 'room-1' }, { discussionRid: 'room-1' }] };
		expect(aggregate.mock.calls[0][0][0]).toEqual({ $match: expected });
		expect(countDocuments.mock.calls[0][0]).toEqual(expected);
	});

	/**
	 * The whole reason this is an aggregation and still cheap.
	 *
	 * `$match`/`$sort`/`$skip`/`$limit` are pushed into the query layer, so `{ rid, createdAt }` and
	 * `{ discussionRid, createdAt }` serve the `$or` as an index-ordered merge and the lookup runs over one
	 * page. Moving `$lookup` above the paging stages would join the room's entire call history instead.
	 */
	it('should page before joining the discussion room, not after', async () => {
		const { model, aggregate } = setupAggregation();

		model.findPaginatedByRoomId('room-1', { offset: 25, count: 25 });

		const stages = stageNames(aggregate.mock.calls[0][0]);
		expect(stages).toEqual(['$match', '$sort', '$skip', '$limit', '$lookup', '$addFields', '$project']);
	});

	// `$skip: 0` is a stage that does nothing, and `$limit: 0` is one that returns nothing.
	it('should omit the paging stages entirely when it has no offset or count', async () => {
		const { model, aggregate } = setupAggregation();

		model.findPaginatedByRoomId('room-1');

		const stages = stageNames(aggregate.mock.calls[0][0]);
		expect(stages).not.toContain('$skip');
		expect(stages).not.toContain('$limit');
	});

	it('should sort newest first', async () => {
		const { model, aggregate } = setupAggregation();

		model.findPaginatedByRoomId('room-1');

		expect(aggregate.mock.calls[0][0][1]).toEqual({ $sort: { createdAt: -1 } });
	});

	// `providerData` can hold provider credentials, and the joined room is scaffolding for the two fields
	// lifted out of it — neither belongs in what the list hands back.
	it('should drop providerData and the joined room from the result', async () => {
		const { model, aggregate } = setupAggregation();

		model.findPaginatedByRoomId('room-1');

		const pipeline = aggregate.mock.calls[0][0];
		expect(pipeline[pipeline.length - 1]).toEqual({ $project: { providerData: 0, discussionRoom: 0 } });
	});

	it('should take the discussion title from fname, falling back to name', async () => {
		const { model, aggregate } = setupAggregation();

		model.findPaginatedByRoomId('room-1');

		const [{ $addFields }] = aggregate.mock.calls[0][0].filter((stage: Record<string, unknown>) => '$addFields' in stage);
		expect($addFields.discussionTitle).toEqual({
			$ifNull: [{ $first: '$discussionRoom.fname' }, { $first: '$discussionRoom.name' }],
		});
	});
});
