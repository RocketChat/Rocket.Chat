import { Users } from '@rocket.chat/models';

import { API } from '../api';

jest.mock('@rocket.chat/models', () => ({
	Subscriptions: {},
	Users: { findOneById: jest.fn() },
}));
jest.mock('@rocket.chat/rest-typings', () => {
	const { default: Ajv } = jest.requireActual('ajv');
	return {
		ajv: new Ajv(),
		ajvQuery: new Ajv(),
		validateUnauthorizedErrorResponse: jest.fn(),
		validateBadRequestErrorResponse: jest.fn(),
		validateForbiddenErrorResponse: jest.fn(),
		ise2eSetUserPublicAndPrivateKeysParamsPOST: jest.fn(),
	};
});
jest.mock('../../lib/authorization/canAccessRoom', () => ({}));
jest.mock('../../lib/authorization/hasPermission', () => ({}));
jest.mock('../../lib/e2e/functions/handleSuggestedGroupKey', () => ({}));
jest.mock('../../lib/e2e/functions/provideUsersSuggestedGroupKeys', () => ({}));
jest.mock('../../lib/e2e/functions/resetRoomKey', () => ({}));
jest.mock('../../meteor-methods/platform/getUsersOfRoomWithoutKey', () => ({}));
jest.mock('../../meteor-methods/platform/requestSubscriptionKeys', () => ({}));
jest.mock('../../meteor-methods/platform/setRoomKeyID', () => ({}));
jest.mock('../../meteor-methods/platform/setUserPublicAndPrivateKeys', () => ({}));
jest.mock('../../meteor-methods/platform/updateGroupKey', () => ({}));
jest.mock('../../settings', () => ({}));
jest.mock('../api', () => {
	const v1 = {
		get: jest.fn().mockReturnThis(),
		post: jest.fn().mockReturnThis(),
		success: jest.fn((payload) => ({ success: true, ...payload })),
	};
	return { API: { v1 } };
});

require('./e2e');

type PublicKeyResponse = { success: true; public_key: string | null };
type PublicKeyRoute = [
	string,
	{ authRequired: boolean; response: { 200: (value: unknown) => boolean; 401: unknown } },
	(this: { userId: string }) => Promise<PublicKeyResponse>,
];

const getRoute = (): PublicKeyRoute => {
	const route = (API.v1.get as jest.Mock).mock.calls.find(([name]) => name === 'e2e.fetchMyPublicKey');
	if (!route) {
		throw new Error('The e2e.fetchMyPublicKey route is not registered.');
	}
	return route as PublicKeyRoute;
};

describe('e2e.fetchMyPublicKey', () => {
	beforeEach(() => {
		jest.mocked(Users.findOneById).mockReset();
	});

	it('requires authentication and declares an unauthorized response', () => {
		const [, options] = getRoute();
		expect(options.authRequired).toBe(true);
		expect(options.response).toHaveProperty('401');
	});

	it('selects the authenticated user public key without selecting private key fields', async () => {
		jest.mocked(Users.findOneById).mockResolvedValue({ e2e: { public_key: 'public-key', private_key: 'private-canary' } } as never);
		const [, , action] = getRoute();

		await expect(action.call({ userId: 'current-user' })).resolves.toEqual({ success: true, public_key: 'public-key' });
		expect(Users.findOneById).toHaveBeenCalledWith('current-user', { projection: { 'e2e.public_key': 1 } });
	});

	it.each([undefined, {}, { e2e: {} }, { e2e: { public_key: '' } }])('returns explicit null when no key exists: %j', async (user) => {
		jest.mocked(Users.findOneById).mockResolvedValue(user as never);
		const [, , action] = getRoute();

		await expect(action.call({ userId: 'current-user' })).resolves.toEqual({ success: true, public_key: null });
	});

	it('accepts key and null responses but rejects absent keys and private fields', () => {
		const [, { response }] = getRoute();
		expect(response[200]({ success: true, public_key: 'key' })).toBe(true);
		expect(response[200]({ success: true, public_key: null })).toBe(true);
		expect(response[200]({ success: true })).toBe(false);
		expect(response[200]({ success: true, public_key: 'key', private_key: 'private-canary' })).toBe(false);
	});
});
