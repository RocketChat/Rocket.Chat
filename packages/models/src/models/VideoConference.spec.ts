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

	it('should record a member who is joining as they are added', async () => {
		const { model, updateOne } = setupModel();
		const joinedAt = new Date('2026-08-01T10:00:00Z');

		await model.addMemberById('call-1', { ...member, joined: true, joinedAt });

		expect(updateOne.mock.calls[0][1].$push.users).toMatchObject({ joined: true, joinedAt });
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
		expect(update).toEqual({ $set: { 'users.$[user].joined': true, 'users.$[user].joinedAt': joinedAt } });
		expect(options).toEqual({ arrayFilters: [{ 'user._id': 'user-1' }] });
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
