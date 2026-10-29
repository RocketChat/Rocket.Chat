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

// `Subscriptions` imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({ Rooms: {}, Users: {} }));

// oxlint-disable-next-line import-x/first -- must be registered after the mocks above so the module under test sees them
import { SubscriptionsRaw } from './Subscriptions';

/**
 * These assert the *shape* of the update sent to Mongo rather than its effect: the unit tests for `reply()` stub
 * this method, so this is what actually protects who gets the unread state and what is written to them.
 */
const setupModel = () => {
	const updateMany = jest.fn().mockResolvedValue({});
	const model = new SubscriptionsRaw({ collection: () => ({}) } as never);
	Object.defineProperty(model, 'updateMany', { value: updateMany });

	return { model, updateMany };
};

describe('SubscriptionsRaw.addUnreadGroupMentionThreadByRoomIdExcludingUserIds', () => {
	it('should target every subscription of the room except the excluded users', async () => {
		const { model, updateMany } = setupModel();

		await model.addUnreadGroupMentionThreadByRoomIdExcludingUserIds('rid', ['sender', 'follower'], 'tmid');

		const [query] = updateMany.mock.calls[0];
		expect(query.rid).toBe('rid');
		expect(query['u._id']).toEqual({ $nin: ['sender', 'follower'] });
	});

	it('should skip members who muted group mentions', async () => {
		const { model, updateMany } = setupModel();

		await model.addUnreadGroupMentionThreadByRoomIdExcludingUserIds('rid', ['sender'], 'tmid');

		const [query] = updateMany.mock.calls[0];
		expect(query.muteGroupMentions).toEqual({ $ne: true });
	});

	// Banned subscriptions are closed on purpose and invited ones are not members yet, both carry a `status`.
	it('should only touch joined subscriptions, not banned or invited ones', async () => {
		const { model, updateMany } = setupModel();

		await model.addUnreadGroupMentionThreadByRoomIdExcludingUserIds('rid', ['sender'], 'tmid');

		const [query] = updateMany.mock.calls[0];
		expect(query.status).toEqual({ $exists: false });
	});

	it('should not restrict the query by anything else', async () => {
		const { model, updateMany } = setupModel();

		await model.addUnreadGroupMentionThreadByRoomIdExcludingUserIds('rid', ['sender'], 'tmid');

		const [query] = updateMany.mock.calls[0];
		expect(Object.keys(query).sort()).toEqual(['muteGroupMentions', 'rid', 'status', 'u._id']);
	});

	it('should mark the thread as unread and as a group mention', async () => {
		const { model, updateMany } = setupModel();

		await model.addUnreadGroupMentionThreadByRoomIdExcludingUserIds('rid', ['sender'], 'tmid');

		const [, update] = updateMany.mock.calls[0];
		expect(update.$addToSet).toEqual({ tunread: 'tmid', tunreadGroup: 'tmid' });
	});

	it('should highlight and open the room', async () => {
		const { model, updateMany } = setupModel();

		await model.addUnreadGroupMentionThreadByRoomIdExcludingUserIds('rid', ['sender'], 'tmid');

		const [, update] = updateMany.mock.calls[0];
		expect(update.$set).toEqual({ alert: true, open: true });
	});

	// Thread messages deliberately never bump the room's unread counter.
	it('should not touch the room unread counters', async () => {
		const { model, updateMany } = setupModel();

		await model.addUnreadGroupMentionThreadByRoomIdExcludingUserIds('rid', ['sender'], 'tmid');

		const [, update] = updateMany.mock.calls[0];
		expect(update).not.toHaveProperty('$inc');
	});
});
