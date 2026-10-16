import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

type UsersWaitingForE2EKeys = Record<string, { _id: string; public_key: string }[]>;

const registeredRoutes: Record<string, (this: any) => Promise<any>> = {};

const apiStub = {
	v1: {
		get(name: string, _options: unknown, action: (this: any) => Promise<any>) {
			registeredRoutes[name] = action;
			return apiStub.v1;
		},
		post(name: string, _options: unknown, action: (this: any) => Promise<any>) {
			registeredRoutes[name] = action;
			return apiStub.v1;
		},
		success: (payload?: Record<string, unknown>) => ({ statusCode: 200, body: { success: true, ...payload } }),
		failure: (error?: unknown) => ({ statusCode: 400, body: { success: false, error } }),
		forbidden: (error?: unknown) => ({ statusCode: 403, body: { success: false, error } }),
	},
};

const validatorStub = { compile: () => () => true };

const canAccessRoomIdAsync = sinon.stub();
const findUsersWithPublicE2EKeyByRids = sinon.stub();
const settingsGet = sinon.stub();

proxyquire.noCallThru().load('../../../../../server/api/v1/e2e', {
	'@rocket.chat/models': {
		Subscriptions: { findUsersWithPublicE2EKeyByRids },
		Users: { fetchKeysByUserId: sinon.stub() },
	},
	'@rocket.chat/rest-typings': {
		ajv: validatorStub,
		ajvQuery: validatorStub,
		validateUnauthorizedErrorResponse: {},
		validateBadRequestErrorResponse: {},
		validateForbiddenErrorResponse: {},
		ise2eSetUserPublicAndPrivateKeysParamsPOST: {},
	},
	'../../lib/authorization/canAccessRoom': { canAccessRoomIdAsync },
	'../../lib/authorization/hasPermission': { hasPermissionAsync: sinon.stub() },
	'../../lib/e2e/functions/handleSuggestedGroupKey': { handleSuggestedGroupKey: sinon.stub() },
	'../../lib/e2e/functions/provideUsersSuggestedGroupKeys': { provideUsersSuggestedGroupKeys: sinon.stub() },
	'../../lib/e2e/functions/resetRoomKey': { resetRoomKey: sinon.stub() },
	'../../meteor-methods/platform/getUsersOfRoomWithoutKey': { getUsersOfRoomWithoutKeyMethod: sinon.stub() },
	'../../meteor-methods/platform/requestSubscriptionKeys': { requestSubscriptionKeysMethod: sinon.stub() },
	'../../meteor-methods/platform/setRoomKeyID': { setRoomKeyIDMethod: sinon.stub() },
	'../../meteor-methods/platform/setUserPublicAndPrivateKeys': { setUserPublicAndPrivateKeysMethod: sinon.stub() },
	'../../meteor-methods/platform/updateGroupKey': { updateGroupKey: sinon.stub() },
	'../../settings': { settings: { get: settingsGet } },
	'../api': { API: apiStub },
});

describe('e2e.fetchUsersWaitingForGroupKey', () => {
	const callerId = 'caller-id';

	// The caller is subscribed to `joined-room` only. `foreign-room` is a room the caller
	// has no subscription to, and `unknown-room` does not exist at all.
	const roomsCallerCanAccess = ['joined-room'];

	const subscriptionsByRoom: Record<string, { _id: string; public_key: string }[]> = {
		'joined-room': [{ _id: 'member-of-joined-room', public_key: 'joined-public-key' }],
		'foreign-room': [{ _id: 'member-of-foreign-room', public_key: 'foreign-public-key' }],
	};

	const callEndpoint = async (roomIds: string[]): Promise<UsersWaitingForE2EKeys> => {
		const result = await registeredRoutes['e2e.fetchUsersWaitingForGroupKey'].call({
			userId: callerId,
			queryParams: { roomIds },
		});

		return result.body.usersWaitingForE2EKeys;
	};

	beforeEach(() => {
		canAccessRoomIdAsync.reset();
		findUsersWithPublicE2EKeyByRids.reset();
		settingsGet.reset();

		settingsGet.withArgs('E2E_Enable').returns(true);

		canAccessRoomIdAsync.callsFake(async (rid: string, uid: string) => uid === callerId && roomsCallerCanAccess.includes(rid));

		findUsersWithPublicE2EKeyByRids.callsFake((rids: string[]) => ({
			toArray: async () => rids.filter((rid) => subscriptionsByRoom[rid]).map((rid) => ({ rid, users: subscriptionsByRoom[rid] })),
		}));
	});

	it('should not return any user for a room the caller cannot access', async () => {
		expect(await callEndpoint(['foreign-room'])).to.deep.equal({});
	});

	it('should return users only for the rooms the caller can access', async () => {
		expect(await callEndpoint(['joined-room', 'foreign-room', 'unknown-room'])).to.deep.equal({
			'joined-room': subscriptionsByRoom['joined-room'],
		});
	});

	it('should return users for every requested room the caller can access', async () => {
		expect(await callEndpoint(['joined-room'])).to.deep.equal({
			'joined-room': subscriptionsByRoom['joined-room'],
		});
	});

	it('should return an empty result when E2E is disabled', async () => {
		settingsGet.withArgs('E2E_Enable').returns(false);

		expect(await callEndpoint(['joined-room'])).to.deep.equal({});
	});
});
