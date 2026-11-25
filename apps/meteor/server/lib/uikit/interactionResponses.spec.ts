import { viewSubmitAnswer, withDefaultCloseTarget } from './interactionResponses';

const mockFindOneByIdForUser = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	UiKitViews: { findOneByIdForUser: (...args: unknown[]) => mockFindOneByIdForUser(...args) },
}));

const container = { type: 'view', id: 'view-id' };

beforeEach(() => mockFindOneByIdForUser.mockReset());

describe('withDefaultCloseTarget', () => {
	it('targets the recorded modal the action came from', async () => {
		mockFindOneByIdForUser.mockResolvedValue({ type: 'modal' });
		const result: Record<string, unknown> = { type: 'modal.close' };

		await withDefaultCloseTarget(result, container, 'app', 'user');

		expect(result.viewId).toBe('view-id');
	});

	it('targets the view of a visitor, which has no record', async () => {
		const result: Record<string, unknown> = { type: 'modal.close' };

		await withDefaultCloseTarget(result, container, 'app', undefined);

		expect(result.viewId).toBe('view-id');
	});

	it.each([
		['a recorded contextual bar', () => mockFindOneByIdForUser.mockResolvedValue({ type: 'contextual_bar' })],
		['a user view with no record', () => mockFindOneByIdForUser.mockResolvedValue(null)],
		['a record that cannot be read', () => mockFindOneByIdForUser.mockRejectedValue(new Error('db down'))],
	])('gives no default for %s', async (_name, arrange) => {
		arrange();
		const result: Record<string, unknown> = { type: 'modal.close' };

		await withDefaultCloseTarget(result, container, 'app', 'user');

		expect(result.viewId).toBeUndefined();
	});

	it('does not throw when the request has no container', async () => {
		const result: Record<string, unknown> = { type: 'modal.close' };

		await expect(withDefaultCloseTarget(result, undefined as never, 'app', undefined)).resolves.toBeUndefined();

		expect(result.viewId).toBeUndefined();
	});

	it.each([
		['names a view id', { type: 'modal.close', viewId: 'other' }, container],
		['names a view', { type: 'modal.close', view: { id: 'other' } }, container],
		['is not a close', { type: 'modal.update' }, container],
		['comes from a message', { type: 'modal.close' }, { type: 'message', id: 'mid' }],
	])('keeps a response that %s', async (_name, result, source) => {
		const before = JSON.stringify(result);

		await withDefaultCloseTarget(result, source, 'app', undefined);

		expect(JSON.stringify(result)).toBe(before);
	});
});

describe('viewSubmitAnswer', () => {
	it('answers the result of a delivered update', () => {
		expect(viewSubmitAnswer(true, { type: 'modal.update' })).toEqual({ status: 200, body: { type: 'modal.update' } });
	});

	it('answers 409 for a dropped update', () => {
		expect(viewSubmitAnswer(false, { type: 'modal.update' }).status).toBe(409);
	});
});
