// `BaseRaw` participates in a circular import that leaves it uninitialized when this module is loaded
// directly by jest. Only its constructor matters here, so it is stubbed out.
jest.mock('./BaseRaw', () => ({
	BaseRaw: class {
		constructor(
			public db: unknown,
			public name?: string,
			public trash?: unknown,
		) {}
	},
}));

// oxlint-disable-next-line import-x/first -- must be registered before the module under test is loaded
import { VideoConferenceRoomsRaw } from './VideoConferenceRooms';

const setupModel = () => {
	const model = new VideoConferenceRoomsRaw({ collection: () => ({}) } as never);
	const stubs = {
		insertOne: jest.fn().mockResolvedValue({ insertedId: 'link-1' }),
		findOne: jest.fn().mockResolvedValue(null),
		find: jest.fn().mockReturnValue({}),
		findOneAndUpdate: jest.fn().mockResolvedValue(null),
		deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
		updateMany: jest.fn().mockResolvedValue({}),
	};
	for (const [name, value] of Object.entries(stubs)) {
		Object.defineProperty(model, name, { value });
	}

	return { model, ...stubs };
};

const createdBy = { _id: 'user-1', name: 'User One', username: 'user.one' };

describe('VideoConferenceRoomsRaw', () => {
	it('is stored as video_conference_rooms, with no trash collection', () => {
		const { model } = setupModel();

		expect((model as unknown as { name: string }).name).toBe('video_conference_rooms');
		expect((model as unknown as { trash: unknown }).trash).toBeUndefined();
	});

	// The unique url index is what makes a slug clash surface as a duplicate key, which the caller retries.
	it('indexes', () => {
		const { model } = setupModel();

		expect((model as unknown as { modelIndexes: () => unknown }).modelIndexes()).toEqual([
			{ key: { url: 1 }, unique: true },
			{ key: { rid: 1, createdAt: 1 } },
		]);
	});

	it('create inserts what it receives with createdAt set to now, and answers the id', async () => {
		const { model, insertOne } = setupModel();
		const link = { rid: 'room-1', providerName: 'livekit', title: 'Weekly', url: 'weekly', createdBy };

		expect(await model.create(link)).toBe('link-1');

		const [doc] = insertOne.mock.calls[0];
		expect(doc).toMatchObject(link);
		expect(doc.createdAt).toBeInstanceOf(Date);
		expect(Date.now() - doc.createdAt.getTime()).toBeLessThan(1000);
	});

	// Uniqueness is the index's, and validation the service's: the model stores whatever it is given.
	it('create inserts an invalid-looking link without throwing', async () => {
		const { model, insertOne } = setupModel();

		await expect(model.create({ rid: '', providerName: '', title: '', url: '', createdBy } as never)).resolves.toBe('link-1');
		expect(insertOne).toHaveBeenCalledTimes(1);
	});

	it('findOneByUrl filters on the url', async () => {
		const { model, findOne } = setupModel();
		const options = { projection: { _id: 1 } };

		await model.findOneByUrl('weekly', options);

		expect(findOne).toHaveBeenCalledWith({ url: 'weekly' }, options);
	});

	it('findByRoomId filters on the room and sorts oldest first', () => {
		const { model, find } = setupModel();
		const cursor = {};
		find.mockReturnValue(cursor);

		// oxlint-disable-next-line testing-library/await-async-queries -- a model finder returning a cursor, not a DOM query
		expect(model.findByRoomId('room-1', { projection: { url: 1 } })).toBe(cursor);
		expect(find).toHaveBeenCalledWith({ rid: 'room-1' }, { sort: { createdAt: 1 }, projection: { url: 1 } });
	});

	// Anchored, so `{ url: 1 }` serves it; escaped, so the prefix's own characters are not read as a pattern.
	it('findUrlsStartingWith matches an anchored, literal prefix', () => {
		const { model, find } = setupModel();

		model.findUrlsStartingWith('a.b+', { projection: { url: 1 } });

		const [filter, options] = find.mock.calls[0];
		expect(options).toEqual({ projection: { url: 1 } });
		const pattern = new RegExp(filter.url.$regex);
		expect(pattern.test('a.b+')).toBe(true);
		expect(pattern.test('a.b+-2')).toBe(true);
		expect(pattern.test('axbb')).toBe(false);
		expect(pattern.test('xa.b+')).toBe(false);
	});

	it('setTitleAndUrlById sets exactly the title and url, and answers the link after the change', async () => {
		const { model, findOneAndUpdate } = setupModel();

		await model.setTitleAndUrlById('link-1', 'Daily', 'daily');

		expect(findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: 'link-1' },
			{ $set: { title: 'Daily', url: 'daily' } },
			{ returnDocument: 'after' },
		);
	});

	it('removeByRoomId deletes the links of the room', async () => {
		const { model, deleteMany } = setupModel();

		await model.removeByRoomId('room-1');

		expect(deleteMany).toHaveBeenCalledWith({ rid: 'room-1' });
	});

	it("updateUserReferences rewrites the creator's name and username on their links", async () => {
		const { model, updateMany } = setupModel();

		await model.updateUserReferences('user-1', 'new.name', 'New Name');

		expect(updateMany).toHaveBeenCalledWith(
			{ 'createdBy._id': 'user-1' },
			{ $set: { 'createdBy.name': 'New Name', 'createdBy.username': 'new.name' } },
		);
	});
});
