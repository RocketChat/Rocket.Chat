import type { Collection, Db, FindOptions } from 'mongodb';

import { BaseRaw } from './BaseRaw';

// `BaseRaw` imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

const find = jest.fn();

class TestModel extends BaseRaw<{ _id: string; name: string; password: string }> {
	constructor() {
		super({ collection: () => ({ find }) } as unknown as Db, 'test');
	}
}

const projectionSentToDriver = (projection: Record<string, unknown>): unknown => {
	new TestModel().find({}, { projection } as FindOptions<{ _id: string; name: string; password: string }>);
	return find.mock.calls.at(-1)?.[1]?.projection;
};

describe('doNotMixInclusionAndExclusionFields', () => {
	beforeEach(() => find.mockReset().mockReturnValue({} as unknown as Collection<any>));

	it('should keep an inclusion-only projection untouched', () => {
		expect(projectionSentToDriver({ name: 1 })).toEqual({ name: 1 });
		expect(projectionSentToDriver({ name: true })).toEqual({ name: true });
	});

	it('should keep an exclusion-only projection untouched, whichever notation is used', () => {
		expect(projectionSentToDriver({ password: 0 })).toEqual({ password: 0 });
		expect(projectionSentToDriver({ password: false })).toEqual({ password: false });
		expect(projectionSentToDriver({ password: 0, name: false })).toEqual({ password: 0, name: false });
	});

	it('should drop the exclusions from a mixed projection, whichever notation is used', () => {
		expect(projectionSentToDriver({ name: 1, password: 0 })).toEqual({ name: 1 });
		expect(projectionSentToDriver({ name: 1, password: false })).toEqual({ name: 1 });
		expect(projectionSentToDriver({ name: true, password: false })).toEqual({ name: true });
		expect(projectionSentToDriver({ name: 1, _id: false })).toEqual({ name: 1 });
	});

	it('should not mutate the projection owned by the caller', () => {
		const options = { projection: { name: 1, password: false } } as unknown as FindOptions<{ _id: string; name: string; password: string }>;

		new TestModel().find({}, options);

		expect(options.projection).toEqual({ name: 1, password: false });
	});
});

describe('deleteMany with a trash collection', () => {
	let docs: { _id: string; name: string; password: string }[] = [];
	const trash = { updateOne: jest.fn(), bulkWrite: jest.fn() };
	const deleteMany = jest.fn();

	class TrashedModel extends BaseRaw<{ _id: string; name: string; password: string }> {
		constructor() {
			super({ collection: () => ({ find: () => docs, deleteMany }) } as unknown as Db, 'test', trash as unknown as Collection<any>);
		}
	}

	beforeEach(() => {
		trash.updateOne.mockReset();
		trash.bulkWrite.mockReset();
		deleteMany
			.mockReset()
			.mockImplementation(async ({ _id }: { _id: { $in: string[] } }) => ({ acknowledged: true, deletedCount: _id.$in.length }));
	});

	it('copies each document to the trash with its own upsert by default', async () => {
		docs = [
			{ _id: 'a', name: 'A', password: 'x' },
			{ _id: 'b', name: 'B', password: 'y' },
		];

		await new TrashedModel().deleteMany({});

		expect(trash.updateOne).toHaveBeenCalledTimes(2);
		expect(trash.updateOne).toHaveBeenNthCalledWith(
			1,
			{ _id: 'a' },
			{ $set: expect.objectContaining({ name: 'A', __collection__: 'test' }) },
			{ upsert: true, session: undefined },
		);
		expect(trash.bulkWrite).not.toHaveBeenCalled();
		expect(deleteMany.mock.calls[0][0]).toEqual({ _id: { $in: ['a', 'b'] } });
	});

	it('copies to the trash and deletes in chunks of 1000 when asked to', async () => {
		docs = Array.from({ length: 2500 }, (_, i) => ({ _id: `id${i}`, name: `name${i}`, password: 'x' }));

		const { deletedCount } = await new TrashedModel().deleteMany({}, { bulkTrash: true });

		expect(trash.updateOne).not.toHaveBeenCalled();
		expect(trash.bulkWrite.mock.calls.map(([operations]) => operations.length)).toEqual([1000, 1000, 500]);
		expect(trash.bulkWrite.mock.calls[0][0][0]).toEqual({
			updateOne: {
				filter: { _id: 'id0' },
				update: { $set: expect.objectContaining({ name: 'name0', __collection__: 'test' }) },
				upsert: true,
			},
		});
		expect(deleteMany.mock.calls.map(([filter]) => filter._id.$in.length)).toEqual([1000, 1000, 500]);
		expect(deletedCount).toBe(2500);
	});

	it('does not issue an empty delete after a full chunk', async () => {
		docs = Array.from({ length: 1000 }, (_, i) => ({ _id: `id${i}`, name: `name${i}`, password: 'x' }));

		const { deletedCount } = await new TrashedModel().deleteMany({}, { bulkTrash: true });

		expect(deleteMany).toHaveBeenCalledTimes(1);
		expect(deletedCount).toBe(1000);
	});
});
