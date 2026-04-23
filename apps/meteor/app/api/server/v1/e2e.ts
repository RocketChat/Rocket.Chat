import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';
import {
	ajv,
	ajvQuery,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	ise2eSetUserPublicAndPrivateKeysParamsPOST,
} from '@rocket.chat/rest-typings';
import ExpiryMap from 'expiry-map';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { handleSuggestedGroupKey } from '../../../e2e/server/functions/handleSuggestedGroupKey';
import { provideUsersSuggestedGroupKeys } from '../../../e2e/server/functions/provideUsersSuggestedGroupKeys';
import { resetRoomKey } from '../../../e2e/server/functions/resetRoomKey';
import { getUsersOfRoomWithoutKeyMethod } from '../../../e2e/server/methods/getUsersOfRoomWithoutKey';
import { setRoomKeyIDMethod } from '../../../e2e/server/methods/setRoomKeyID';
import { setUserPublicAndPrivateKeysMethod } from '../../../e2e/server/methods/setUserPublicAndPrivateKeys';
import { updateGroupKey } from '../../../e2e/server/methods/updateGroupKey';
import { settings } from '../../../settings/server';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

// After 10s the room lock will expire, meaning that if for some reason the process never completed
// The next reset will be available 10s after
const LockMap = new ExpiryMap<string, boolean>(10000);

type E2eSetRoomKeyIdProps = {
	rid: string;
	keyID: string;
};

type e2eGetUsersOfRoomWithoutKeyParamsGET = {
	rid: string;
};

type e2eUpdateGroupKeyParamsPOST = {
	uid: string;
	rid: string;
	key: string;
};

type E2EFetchUsersWaitingForGroupKeyProps = { roomIds: string[] };

type E2EProvideUsersGroupKeyProps = {
	usersSuggestedGroupKeys: Record<IRoom['_id'], { _id: IUser['_id']; key: string; oldKeys: ISubscription['suggestedOldRoomKeys'] }[]>;
};

type E2EResetRoomKeyProps = {
	rid: string;
	e2eKey: string;
	e2eKeyId: string;
};

const E2eSetRoomKeyIdSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		keyID: {
			type: 'string',
		},
	},
	required: ['rid', 'keyID'],
	additionalProperties: false,
};

const e2eGetUsersOfRoomWithoutKeyParamsGETSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['rid'],
};

const e2eUpdateGroupKeyParamsPOSTSchema = {
	type: 'object',
	properties: {
		uid: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
		key: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['uid', 'rid', 'key'],
};

const E2EFetchUsersWaitingForGroupKeySchema = {
	type: 'object',
	properties: {
		roomIds: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
	},
	required: ['roomIds'],
	additionalProperties: false,
};

const E2EProvideUsersGroupKeySchema = {
	type: 'object',
	properties: {
		usersSuggestedGroupKeys: {
			type: 'object',
			additionalProperties: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						_id: { type: 'string' },
						key: { type: 'string' },
						oldKeys: {
							type: 'array',
							items: {
								type: 'object',
								properties: { e2eKeyId: { type: 'string' }, ts: { type: 'string' }, E2EKey: { type: 'string' } },
							},
						},
					},
					required: ['_id', 'key'],
					additionalProperties: false,
				},
			},
		},
	},
	required: ['usersSuggestedGroupKeys'],
	additionalProperties: false,
};

const E2EResetRoomKeySchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		e2eKey: {
			type: 'string',
		},
		e2eKeyId: {
			type: 'string',
		},
	},
	required: ['rid', 'e2eKey', 'e2eKeyId'],
	additionalProperties: false,
};

const isE2eSetRoomKeyIdProps = ajv.compile<E2eSetRoomKeyIdProps>(E2eSetRoomKeyIdSchema);

const ise2eGetUsersOfRoomWithoutKeyParamsGET = ajv.compile<e2eGetUsersOfRoomWithoutKeyParamsGET>(
	e2eGetUsersOfRoomWithoutKeyParamsGETSchema,
);

const ise2eUpdateGroupKeyParamsPOST = ajv.compile<e2eUpdateGroupKeyParamsPOST>(e2eUpdateGroupKeyParamsPOSTSchema);

const isE2EFetchUsersWaitingForGroupKeyProps = ajvQuery.compile<E2EFetchUsersWaitingForGroupKeyProps>(
	E2EFetchUsersWaitingForGroupKeySchema,
);

const isE2EProvideUsersGroupKeyProps = ajv.compile<E2EProvideUsersGroupKeyProps>(E2EProvideUsersGroupKeySchema);

const isE2EResetRoomKeyProps = ajv.compile<E2EResetRoomKeyProps>(E2EResetRoomKeySchema);

const e2eEndpoints = API.v1
	.post(
		'e2e.setRoomKeyID',
		{
			authRequired: true,
			body: isE2eSetRoomKeyIdProps,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<void>({
					type: 'object',
				}),
			},
		},

		async function action() {
			const { rid, keyID } = this.bodyParams;

			await setRoomKeyIDMethod(this.userId, rid, keyID);

			return API.v1.success();
		},
	)
	.get(
		'e2e.fetchMyKeys',
		{
			authRequired: true,
			query: undefined,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<{ public_key?: string; private_key?: string }>({
					type: 'object',
					properties: {
						public_key: { type: 'string' },
						private_key: { type: 'string' },
					},
				}),
			},
		},
		async function action() {
			const result = await Users.fetchKeysByUserId(this.userId);

			return API.v1.success(result as { public_key?: string; private_key?: string });
		},
	)
	.get(
		'e2e.getUsersOfRoomWithoutKey',
		{
			authRequired: true,
			query: ise2eGetUsersOfRoomWithoutKeyParamsGET,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<{
					users: Pick<IUser, '_id' | 'e2e'>[];
				}>({
					type: 'object',
					properties: {
						users: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									_id: { type: 'string' },
									e2e: {
										type: 'object',
										properties: {
											private_key: { type: 'string' },
											public_key: { type: 'string' },
										},
									},
								},
								required: ['_id'],
							},
						},
					},
					required: ['users'],
				}),
			},
		},

		async function action() {
			const { rid } = this.queryParams;

			const result = await getUsersOfRoomWithoutKeyMethod(this.userId, rid);

			return API.v1.success(result);
		},
	)
	.post(
		'e2e.rejectSuggestedGroupKey',
		{
			authRequired: true,
			body: ise2eGetUsersOfRoomWithoutKeyParamsGET,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<void>({
					type: 'object',
				}),
			},
		},

		async function action() {
			const { rid } = this.bodyParams;

			await handleSuggestedGroupKey('reject', rid, this.userId, 'e2e.rejectSuggestedGroupKey');

			return API.v1.success();
		},
	)
	.post(
		'e2e.acceptSuggestedGroupKey',
		{
			authRequired: true,
			body: ise2eGetUsersOfRoomWithoutKeyParamsGET,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<void>({
					type: 'object',
				}),
			},
		},

		async function action() {
			const { rid } = this.bodyParams;

			await handleSuggestedGroupKey('accept', rid, this.userId, 'e2e.acceptSuggestedGroupKey');

			return API.v1.success();
		},
	)
	.get(
		'e2e.fetchUsersWaitingForGroupKey',
		{
			authRequired: true,
			query: isE2EFetchUsersWaitingForGroupKeyProps,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<{
					usersWaitingForE2EKeys: Record<IRoom['_id'], { _id: IUser['_id']; public_key: string }[]>;
				}>({
					type: 'object',
					properties: {
						usersWaitingForE2EKeys: {
							type: 'object',
							additionalProperties: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										_id: { type: 'string' },
										public_key: { type: 'string' },
									},
									required: ['_id', 'public_key'],
								},
							},
						},
					},
					required: ['usersWaitingForE2EKeys'],
				}),
			},
		},

		async function action() {
			if (!settings.get('E2E_Enable')) {
				return API.v1.success({ usersWaitingForE2EKeys: {} });
			}

			const { roomIds = [] } = this.queryParams;
			const usersWaitingForE2EKeys = (await Subscriptions.findUsersWithPublicE2EKeyByRids(roomIds, this.userId).toArray()).reduce<
				Record<string, { _id: string; public_key: string }[]>
			>((acc, { rid, users }) => ({ [rid]: users, ...acc }), {});

			return API.v1.success({
				usersWaitingForE2EKeys,
			});
		},
	)

	.post(
		'e2e.updateGroupKey',
		{
			authRequired: true,
			body: ise2eUpdateGroupKeyParamsPOST,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<void>({
					type: 'object',
				}),
			},
		},
		async function action() {
			const { uid, rid, key } = this.bodyParams;

			await updateGroupKey(rid, uid, key, this.userId);

			return API.v1.success();
		},
	)
	.post(
		'e2e.provideUsersSuggestedGroupKeys',
		{
			authRequired: true,
			body: isE2EProvideUsersGroupKeyProps,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<void>({
					type: 'object',
				}),
			},
		},

		async function action() {
			if (!settings.get('E2E_Enable')) {
				return API.v1.success();
			}

			await provideUsersSuggestedGroupKeys(this.userId, this.bodyParams.usersSuggestedGroupKeys);

			return API.v1.success();
		},
	)
	// This should have permissions
	.post(
		'e2e.resetRoomKey',
		{
			authRequired: true,
			body: isE2EResetRoomKeyProps,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				200: ajv.compile<void>({
					type: 'object',
				}),
			},
		},

		async function action() {
			const { rid, e2eKey, e2eKeyId } = this.bodyParams;
			if (!(await hasPermissionAsync(this.userId, 'toggle-room-e2e-encryption', rid))) {
				return API.v1.forbidden('error-not-allowed');
			}
			if (LockMap.has(rid)) {
				throw new Error('error-e2e-key-reset-in-progress');
			}

			LockMap.set(rid, true);

			if (!(await canAccessRoomIdAsync(rid, this.userId))) {
				throw new Error('error-not-allowed');
			}

			try {
				await resetRoomKey(rid, this.userId, e2eKey, e2eKeyId);
				return API.v1.success();
			} catch (e) {
				console.error(e);
				return API.v1.failure('error-e2e-key-reset-failed');
			} finally {
				LockMap.delete(rid);
			}
		},
	)
	.post(
		'e2e.setUserPublicAndPrivateKeys',
		{
			authRequired: true,
			body: ise2eSetUserPublicAndPrivateKeysParamsPOST,
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: { success: { type: 'boolean', enum: [true] } },
					required: ['success'],
					additionalProperties: false,
				}),
				401: validateUnauthorizedErrorResponse,
				400: validateBadRequestErrorResponse,
			},
		},
		async function action() {
			const { public_key, private_key, force } = this.bodyParams;

			await setUserPublicAndPrivateKeysMethod(this.userId, {
				public_key,
				private_key,
				force,
			});

			return API.v1.success();
		},
	);

/**
 * @openapi
 *  /api/v1/e2e.setUserPublicAndPrivateKeys:
 *    post:
 *      description: Sets the end-to-end encryption keys for the authenticated user
 *      security:
 *        - autenticated: {}
 *      requestBody:
 *        description: A tuple containing the public and the private keys
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                public_key:
 *                  type: string
 *                private_key:
 *                  type: string
 *                force:
 *                  type: boolean
 *      responses:
 *        200:
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiSuccessV1'
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */

type E2eEndpoints = ExtractRoutesFromAPI<typeof e2eEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends E2eEndpoints {}
}
