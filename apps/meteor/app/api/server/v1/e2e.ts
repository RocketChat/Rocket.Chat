import { Subscriptions, Users } from '@rocket.chat/models';
import {
	BadRequestErrorResponseSchema,
	ForbiddenErrorResponseSchema,
	UnauthorizedErrorResponseSchema,
	SuccessResponseSchema,
	POSTE2ESetRoomKeyIDBodySchema,
	POSTE2ESetRoomKeyIDResponseSchema,
	GETE2EFetchMyKeysResponseSchema,
	GETE2EGetUsersOfRoomWithoutKeyQuerySchema,
	GETE2EGetUsersOfRoomWithoutKeyResponseSchema,
	POSTE2ESetUserPublicAndPrivateKeysBodySchema,
	POSTE2EUpdateGroupKeyBodySchema,
	POSTE2EAcceptSuggestedGroupKeyBodySchema,
	POSTE2ERejectSuggestedGroupKeyBodySchema,
	GETE2EFetchUsersWaitingForGroupKeyQuerySchema,
	GETE2EFetchUsersWaitingForGroupKeyResponseSchema,
	POSTE2EProvideUsersSuggestedGroupKeysBodySchema,
	POSTE2EResetRoomKeyBodySchema,
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

const e2eEndpoints = API.v1
	.post(
		'e2e.setRoomKeyID',
		{
			authRequired: true,
			body: POSTE2ESetRoomKeyIDBodySchema,
			response: {
				200: POSTE2ESetRoomKeyIDResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
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
			response: {
				200: GETE2EFetchMyKeysResponseSchema,
			},
		},
		async function action() {
			const result = await Users.fetchKeysByUserId(this.userId);

			return API.v1.success(result);
		},
	)
	.get(
		'e2e.getUsersOfRoomWithoutKey',
		{
			authRequired: true,
			query: GETE2EGetUsersOfRoomWithoutKeyQuerySchema,
			response: {
				200: GETE2EGetUsersOfRoomWithoutKeyResponseSchema,
			},
		},
		async function action() {
			const { rid } = this.queryParams;

			const result = await getUsersOfRoomWithoutKeyMethod(this.userId, rid);

			return API.v1.success(result);
		},
	)
	.post(
		'e2e.setUserPublicAndPrivateKeys',
		{
			description: 'Sets the end-to-end encryption public and private keys for the authenticated user.',
			authRequired: true,
			body: POSTE2ESetUserPublicAndPrivateKeysBodySchema,
			response: {
				200: SuccessResponseSchema,
				400: BadRequestErrorResponseSchema,
			},
		},
		async function action() {
			const { public_key: publicKey, private_key: privateKey, force } = this.bodyParams;

			await setUserPublicAndPrivateKeysMethod(this.userId, {
				public_key: publicKey,
				private_key: privateKey,
				force,
			});

			return API.v1.success();
		},
	)
	.post(
		'e2e.updateGroupKey',
		{
			description: 'Updates the end-to-end encryption key for a user on a room.',
			authRequired: true,
			body: POSTE2EUpdateGroupKeyBodySchema,
			response: {
				200: SuccessResponseSchema,
			},
		},
		async function action() {
			const { uid, rid, key } = this.bodyParams;

			await updateGroupKey(rid, uid, key, this.userId);

			return API.v1.success();
		},
	)
	.post(
		'e2e.acceptSuggestedGroupKey',
		{
			authRequired: true,
			body: POSTE2EAcceptSuggestedGroupKeyBodySchema,
			response: {
				200: SuccessResponseSchema,
			},
		},
		async function action() {
			const { rid } = this.bodyParams;

			await handleSuggestedGroupKey('accept', rid, this.userId, 'e2e.acceptSuggestedGroupKey');

			return API.v1.success();
		},
	)
	.post(
		'e2e.rejectSuggestedGroupKey',
		{
			authRequired: true,
			body: POSTE2ERejectSuggestedGroupKeyBodySchema,
			response: {
				200: SuccessResponseSchema,
			},
		},
		async function action() {
			const { rid } = this.bodyParams;

			await handleSuggestedGroupKey('reject', rid, this.userId, 'e2e.rejectSuggestedGroupKey');

			return API.v1.success();
		},
	)
	.get(
		'e2e.fetchUsersWaitingForGroupKey',
		{
			authRequired: true,
			query: GETE2EFetchUsersWaitingForGroupKeyQuerySchema,
			response: {
				200: GETE2EFetchUsersWaitingForGroupKeyResponseSchema,
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
		'e2e.provideUsersSuggestedGroupKeys',
		{
			authRequired: true,
			body: POSTE2EProvideUsersSuggestedGroupKeysBodySchema,
			response: {
				200: SuccessResponseSchema,
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
	.post(
		// This should have permissions
		'e2e.resetRoomKey',
		{
			authRequired: true,
			body: POSTE2EResetRoomKeyBodySchema,
			response: {
				200: SuccessResponseSchema,
				400: BadRequestErrorResponseSchema,
				403: ForbiddenErrorResponseSchema,
			},
		},
		async function action() {
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
	);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ExtractRoutesFromAPI<typeof e2eEndpoints> {}
}
