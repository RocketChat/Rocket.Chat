import { Subscriptions, Users } from '@rocket.chat/models';
import {
	ise2eGetUsersOfRoomWithoutKeyParamsGET,
	ise2eSetRoomKeyIDParamsPOST,
	ise2eSetUserPublicAndPrivateKeysParamsPOST,
	ise2eUpdateGroupKeyParamsPOST,
	isE2EProvideUsersGroupKeyProps,
	isE2EFetchUsersWaitingForGroupKeyProps,
	isE2EResetRoomKeyProps,
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
import { API } from '../api';

// After 10s the room lock will expire, meaning that if for some reason the process never completed
// The next reset will be available 10s after
const LockMap = new ExpiryMap<string, boolean>(10000);

API.v1.addRoute(
	'e2e.fetchMyKeys',
	{
		authRequired: true,
	},
	{
		async get() {
			const result = await Users.fetchKeysByUserId(this.userId);

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'e2e.getUsersOfRoomWithoutKey',
	{
		authRequired: true,
		validateParams: ise2eGetUsersOfRoomWithoutKeyParamsGET,
	},
	{
		async get() {
			const { rid } = this.queryParams;

			const result = await getUsersOfRoomWithoutKeyMethod(this.userId, rid);

			return API.v1.success(result);
		},
	},
);

/**
 * @openapi
 *  /api/v1/e2e.setRoomKeyID:
 *    post:
 *      description: Sets the end-to-end encryption key ID for a room
 *      security:
 *        - autenticated: {}
 *      requestBody:
 *        description: A tuple containing the room ID and the key ID
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                rid:
 *                  type: string
 *                keyID:
 *                  type: string
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

API.v1.addRoute(
	'e2e.setRoomKeyID',
	{
		authRequired: true,
		validateParams: ise2eSetRoomKeyIDParamsPOST,
	},
	{
		async post() {
			const { rid, keyID } = this.bodyParams;

			await setRoomKeyIDMethod(this.userId, rid, keyID);

			return API.v1.success();
		},
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
API.v1.addRoute(
	'e2e.setUserPublicAndPrivateKeys',
	{
		authRequired: true,
		validateParams: ise2eSetUserPublicAndPrivateKeysParamsPOST,
	},
	{
		async post() {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { public_key, private_key, force } = this.bodyParams;

			await setUserPublicAndPrivateKeysMethod(this.userId, {
				public_key,
				private_key,
				force,
			});

			return API.v1.success();
		},
	},
);

/**
 * @openapi
 *  /api/v1/e2e.updateGroupKey:
 *    post:
 *      description: Updates the end-to-end encryption key for a user on a room
 *      security:
 *        - autenticated: {}
 *      requestBody:
 *        description: A tuple containing the user ID, the room ID, and the key
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                uid:
 *                  type: string
 *                rid:
 *                  type: string
 *                key:
 *                  type: string
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
API.v1.addRoute(
	'e2e.updateGroupKey',
	{
		authRequired: true,
		validateParams: ise2eUpdateGroupKeyParamsPOST,
		deprecation: {
			version: '8.0.0',
		},
	},
	{
		async post() {
			const { uid, rid, key } = this.bodyParams;

			await updateGroupKey(rid, uid, key, this.userId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'e2e.acceptSuggestedGroupKey',
	{
		authRequired: true,
		validateParams: ise2eGetUsersOfRoomWithoutKeyParamsGET,
	},
	{
		async post() {
			const { rid } = this.bodyParams;

			await handleSuggestedGroupKey('accept', rid, this.userId, 'e2e.acceptSuggestedGroupKey');

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'e2e.rejectSuggestedGroupKey',
	{
		authRequired: true,
		validateParams: ise2eGetUsersOfRoomWithoutKeyParamsGET,
	},
	{
		async post() {
			const { rid } = this.bodyParams;

			await handleSuggestedGroupKey('reject', rid, this.userId, 'e2e.rejectSuggestedGroupKey');

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'e2e.fetchUsersWaitingForGroupKey',
	{
		authRequired: true,
		validateParams: isE2EFetchUsersWaitingForGroupKeyProps,
	},
	{
		async get() {
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
	},
);

API.v1.addRoute(
	'e2e.provideUsersSuggestedGroupKeys',
	{
		authRequired: true,
		validateParams: isE2EProvideUsersGroupKeyProps,
	},
	{
		async post() {
			if (!settings.get('E2E_Enable')) {
				return API.v1.success();
			}

			await provideUsersSuggestedGroupKeys(this.userId, this.bodyParams.usersSuggestedGroupKeys);

			return API.v1.success();
		},
	},
);

// This should have permissions
API.v1.addRoute(
	'e2e.resetRoomKey',
	{ authRequired: true, validateParams: isE2EResetRoomKeyProps },
	{
		async post() {
			const { rid, e2eKey, e2eKeyId } = this.bodyParams;
			if (!(await hasPermissionAsync(this.userId, 'toggle-room-e2e-encryption', rid))) {
				return API.v1.forbidden();
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
	},
);
