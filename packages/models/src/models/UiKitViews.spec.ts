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
import { UiKitViewsRaw } from './UiKitViews.js';

describe('UiKitViewsRaw.saveView', () => {
	it('matches the owner, so one app or user cannot replace the view of another', async () => {
		const updateOne = jest.fn().mockResolvedValue({});
		const model = new UiKitViewsRaw({ collection: () => ({}) } as never);
		Object.defineProperty(model, 'updateOne', { value: updateOne });
		const view = { id: 'view', blocks: [] } as never;

		await model.saveView({ viewId: 'view', appId: 'app', userId: 'user', type: 'modal', view });

		const [filter, update, options] = updateOne.mock.calls[0];
		expect(filter).toEqual({ viewId: 'view', appId: 'app', userId: 'user' });
		expect(update.$set).not.toHaveProperty('appId');
		expect(update.$set).not.toHaveProperty('userId');
		expect(options).toEqual({ upsert: true });
	});
});
