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
