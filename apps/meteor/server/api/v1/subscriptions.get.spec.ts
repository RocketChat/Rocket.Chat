import { getSubscriptions } from '../../publications/subscription';
import { API } from '../api';

jest.mock('@rocket.chat/core-services', () => ({ ClientSafeError: Error }));
jest.mock('@rocket.chat/models', () => ({ Rooms: {}, Subscriptions: {} }));
jest.mock('@rocket.chat/rest-typings', () => {
	const { ajv } = jest.requireActual('../../../../../packages/rest-typings/src/v1/Ajv');
	ajv.addSchema({ type: 'object' }, '#/components/schemas/ISubscription');
	return {
		ajv,
		isSubscriptionsGetProps: jest.fn(),
		isSubscriptionsGetOneProps: jest.fn(),
		isSubscriptionsReadProps: jest.fn(),
		isSubscriptionsUnreadProps: jest.fn(),
		validateBadRequestErrorResponse: jest.fn(),
		validateUnauthorizedErrorResponse: jest.fn(),
	};
});
jest.mock('../../lib/messaging/unread/unreadMessages', () => ({}));
jest.mock('../../lib/readMessages', () => ({}));
jest.mock('../../publications/subscription', () => ({ getSubscriptions: jest.fn() }));
jest.mock('../api', () => ({
	API: {
		v1: {
			get: jest.fn(),
			post: jest.fn(),
			success: jest.fn((payload) => ({ success: true, ...payload })),
		},
	},
}));

require('./subscriptions');

type RemovalRecord = { _id: string; rid?: string; _deletedAt: string };
type Route = [
	string,
	{ authRequired: boolean; response: { 200: (value: unknown) => boolean } },
	(this: { userId: string; queryParams: { updatedSince?: string } }) => Promise<unknown>,
];

const getRoute = (): Route => {
	const route = (API.v1.get as jest.Mock).mock.calls.find(([name]) => name === 'subscriptions.get');
	if (!route) {
		throw new Error('The subscriptions.get route is not registered.');
	}
	return route as Route;
};

const removed: RemovalRecord = { _id: 'subscription-a', rid: 'room-a', _deletedAt: '2026-10-29T00:00:00.000Z' };

describe('subscriptions.get removal records', () => {
	beforeEach(() => {
		jest.mocked(getSubscriptions).mockReset();
	});

	it.each([removed, { _id: removed._id, _deletedAt: removed._deletedAt }])('accepts current and legacy records: %j', (record) => {
		const [, { response }] = getRoute();
		expect(response[200]({ success: true, update: [], remove: [record] })).toBe(true);
	});

	it.each([
		{ rid: removed.rid, _deletedAt: removed._deletedAt },
		{ _id: removed._id, rid: removed.rid },
		{ ...removed, _deletedAt: 'invalid-date' },
		{ ...removed, rid: null },
		{ ...removed, rid: {} },
		{ ...removed, privateField: 'private-canary' },
	])('rejects malformed removal records: %j', (record) => {
		const [, { response }] = getRoute();
		expect(response[200]({ success: true, update: [], remove: [record] })).toBe(false);
	});

	it('returns room IDs for the authenticated user and requested sync date', async () => {
		const [, options, action] = getRoute();
		const date = new Date(removed._deletedAt);
		const result = { update: [], remove: [{ ...removed, _deletedAt: date }] };
		jest.mocked(getSubscriptions).mockResolvedValue(result);

		expect(options.authRequired).toBe(true);
		await expect(action.call({ userId: 'user-a', queryParams: { updatedSince: removed._deletedAt } })).resolves.toEqual({
			success: true,
			...result,
		});
		expect(getSubscriptions).toHaveBeenCalledWith('user-a', date);
	});

	it('preserves the full response without a sync date', async () => {
		const [, , action] = getRoute();
		jest.mocked(getSubscriptions).mockResolvedValue([]);
		await expect(action.call({ userId: 'user-a', queryParams: {} })).resolves.toEqual({ success: true, update: [], remove: [] });
	});
});
