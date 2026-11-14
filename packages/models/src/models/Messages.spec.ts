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
import { MessagesRaw } from './Messages';

const setupModel = () => {
	const updateOne = jest.fn().mockResolvedValue({});
	const findOneAndUpdate = jest.fn().mockResolvedValue(null);
	const model = new MessagesRaw({ collection: () => ({}) } as never);
	Object.defineProperty(model, 'updateOne', { value: updateOne });
	Object.defineProperty(model, 'findOneAndUpdate', { value: findOneAndUpdate });

	return { model, updateOne, findOneAndUpdate };
};

describe('MessagesRaw.decreaseReplyCountById', () => {
	// A second delete of the same reply must not bring back a thread that was already cleared.
	it('should only decrement a positive reply count, in the query', async () => {
		const { model, findOneAndUpdate } = setupModel();

		await model.decreaseReplyCountById('parent-1');

		const [query, update] = findOneAndUpdate.mock.calls[0];
		expect(query).toEqual({ _id: 'parent-1', tcount: { $gt: 0 } });
		expect(update).toEqual({ $inc: { tcount: -1 } });
	});
});

describe('MessagesRaw.unsetThreadByIdIfEmpty', () => {
	it('should only clear the thread while it has no replies, in the query', async () => {
		const { model, updateOne } = setupModel();

		await model.unsetThreadByIdIfEmpty('parent-1');

		const [query, update] = updateOne.mock.calls[0];
		expect(query).toEqual({ _id: 'parent-1', tcount: { $lte: 0 } });
		expect(update).toEqual({ $unset: { tcount: 1, tlm: 1, replies: 1 } });
	});
});
