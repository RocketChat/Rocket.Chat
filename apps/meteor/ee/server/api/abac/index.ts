import { AbacAttributeStoreExternalError, getPdpHealthErrorCode } from '@rocket.chat/abac';
import { Abac } from '@rocket.chat/core-services';
import type { AbacActor, AbacRoomAttributesGrant } from '@rocket.chat/core-services';
import type { IServerEvents, IUser } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';
import { validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings/src/v1/Ajv';
import { convertSubObjectsIntoPaths } from '@rocket.chat/tools';

import {
	GenericSuccessSchema,
	PUTAbacAttributeUpdateBodySchema,
	GETAbacAttributesQuerySchema,
	GETAbacAttributesResponseSchema,
	GETAbacAttributeByIdResponseSchema,
	POSTAbacAttributeDefinitionSchema,
	GETAbacAttributeIsInUseResponseSchema,
	POSTRoomAbacAttributesBodySchema,
	POSTSingleRoomAbacAttributeBodySchema,
	PUTRoomAbacAttributeValuesBodySchema,
	POSTAbacUsersSyncBodySchema,
	GenericErrorSchema,
	GETAbacRoomsListQueryValidator,
	GETAbacRoomsResponseValidator,
	GETAbacAuditEventsQuerySchema,
	GETAbacAuditEventsResponseSchema,
	GETAbacPdpHealthResponseSchema,
	GETAbacPdpHealthErrorResponseSchema,
	GETAbacAttributeKeysResponseSchema,
	GETAbacConfigResponseSchema,
	GETAbacAssignableAttributesQuerySchema,
	GETAbacAssignableAttributesResponseSchema,
	POSTAbacAttributeAssignabilityBodySchema,
	POSTAbacMembershipPreviewBodySchema,
	POSTAbacMembershipPreviewResponseSchema,
} from './schemas';
import { API } from '../../../../server/api';
import type { ExtractRoutesFromAPI } from '../../../../server/api/ApiClass';
import { getPaginationItems } from '../../../../server/api/lib/getPaginationItems';
import { hasAllPermissionAsync, hasPermissionAsync } from '../../../../server/lib/authorization/hasPermission';
import { toAbacAttributeDefinitions } from '../../../../server/lib/rooms/toAbacAttributeDefinitions';
import { settings } from '../../../../server/settings';
import { toCreationAttributesDenialError } from '../../lib/abac/creationAttributesDenial';
import { toAbacActor } from '../../lib/abac/toAbacActor';

const getActorFromUser = (user?: IUser | null): AbacActor | undefined =>
	user?._id
		? {
				_id: user._id,
				username: user.username,
				name: user.name,
			}
		: undefined;

const assertLocalAttributeStore = async (): Promise<void> => {
	if (await Abac.isExternalAttributeStore()) {
		throw new AbacAttributeStoreExternalError();
	}
};

const forbidden = () => API.v1.forbidden('User does not have the permissions required for this action [error-unauthorized]');

const getRoomAttributesGrant = async (uid: IUser['_id'], rid: string): Promise<AbacRoomAttributesGrant | undefined> => {
	if (await hasAllPermissionAsync(uid, ['abac-management', 'manage-abac-admin-rooms'])) {
		return 'manage-abac-admin-rooms';
	}

	if (await hasPermissionAsync(uid, 'edit-room-abac-attributes', rid)) {
		return 'edit-room-abac-attributes';
	}

	return undefined;
};

const abacEndpoints = API.v1
	.post(
		'abac/rooms/:rid/attributes',
		{
			authRequired: true,
			body: POSTRoomAbacAttributesBodySchema,
			response: {
				200: GenericSuccessSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
			license: ['abac'],
		},
		async function action() {
			const { rid } = this.urlParams;
			const { attributes } = this.bodyParams;

			const grant = await getRoomAttributesGrant(this.userId, rid);
			if (!grant) {
				return forbidden();
			}

			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			// This is a replace-all operation
			// IF you need fine grained, use the other endpoints for removing, editing & adding single attributes
			await Abac.setRoomAbacAttributes(rid, attributes, getActorFromUser(this.user), grant);
			return API.v1.success();
		},
	)
	.delete(
		'abac/rooms/:rid/attributes',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-rooms'],
			response: {
				200: GenericSuccessSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { rid } = this.urlParams;

			// We don't need to check if ABAC is enabled to clear attributes
			// Since we're always allowing this operation
			// license check is also not required
			await Abac.setRoomAbacAttributes(rid, {}, getActorFromUser(this.user));
			return API.v1.success();
		},
	)
	// add an abac attribute by key
	.post(
		'abac/rooms/:rid/attributes/:key',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-rooms'],
			license: ['abac'],
			body: POSTSingleRoomAbacAttributeBodySchema,
			response: {
				200: GenericSuccessSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { rid, key } = this.urlParams;
			const { values } = this.bodyParams;

			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			await Abac.addRoomAbacAttributeByKey(rid, key, values, getActorFromUser(this.user));
			return API.v1.success();
		},
	)
	// edit a room attribute
	.put(
		'abac/rooms/:rid/attributes/:key',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-rooms'],
			body: PUTRoomAbacAttributeValuesBodySchema,
			response: {
				200: GenericSuccessSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
			license: ['abac'],
		},
		async function action() {
			const { rid, key } = this.urlParams;
			const { values } = this.bodyParams;

			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			await Abac.replaceRoomAbacAttributeByKey(rid, key, values, getActorFromUser(this.user));
			return API.v1.success();
		},
	)
	// delete a room attribute
	.delete(
		'abac/rooms/:rid/attributes/:key',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-rooms'],
			response: {
				200: GenericSuccessSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { rid, key } = this.urlParams;

			await Abac.removeRoomAbacAttribute(rid, key, getActorFromUser(this.user));
			return API.v1.success();
		},
	)
	// attribute endpoints
	// list attributes
	.get(
		'abac/attributes',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-room-attributes'],
			query: GETAbacAttributesQuerySchema,
			response: {
				200: GETAbacAttributesResponseSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { key, values } = this.queryParams;

			return API.v1.success(
				await Abac.listAbacAttributes(
					{
						key,
						values,
						offset,
						count,
					},
					getActorFromUser(this.user),
				),
			);
		},
	)

	.post(
		'abac/users/sync',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-room-attributes'],
			license: ['abac'],
			body: POSTAbacUsersSyncBodySchema,
			response: {
				200: GenericSuccessSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			const { usernames, ids, emails, ldapIds } = this.bodyParams;

			await Abac.reevaluateUsers({ usernames, ids, emails, ldapIds });

			return API.v1.success();
		},
	)
	.post(
		'abac/attributes',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-room-attributes'],
			license: ['abac'],
			body: POSTAbacAttributeDefinitionSchema,
			response: {
				200: GenericSuccessSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			await assertLocalAttributeStore();

			await Abac.addAbacAttribute(this.bodyParams, getActorFromUser(this.user));
			return API.v1.success();
		},
	)
	// update attribute definition (key and/or values)
	.put(
		'abac/attributes/:_id',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-room-attributes'],
			license: ['abac'],
			body: PUTAbacAttributeUpdateBodySchema,
			response: {
				200: GenericSuccessSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { _id } = this.urlParams;
			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			await assertLocalAttributeStore();

			await Abac.updateAbacAttributeById(_id, this.bodyParams, getActorFromUser(this.user));
			return API.v1.success();
		},
	)
	// get single attribute with usage
	.get(
		'abac/attributes/:_id',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-room-attributes'],
			response: {
				200: GETAbacAttributeByIdResponseSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { _id } = this.urlParams;

			await assertLocalAttributeStore();

			const result = await Abac.getAbacAttributeById(_id, getActorFromUser(this.user));
			return API.v1.success(result);
		},
	)
	// delete attribute (only if not in use)
	.delete(
		'abac/attributes/:_id',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-room-attributes'],
			response: {
				200: GenericSuccessSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { _id } = this.urlParams;

			await assertLocalAttributeStore();

			await Abac.deleteAbacAttributeById(_id, getActorFromUser(this.user));
			return API.v1.success();
		},
	)
	// check if attribute is in use
	.get(
		'abac/attributes/:key/is-in-use',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-room-attributes'],
			response: {
				200: GETAbacAttributeIsInUseResponseSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { key } = this.urlParams;

			await assertLocalAttributeStore();

			const inUse = await Abac.isAbacAttributeInUseByKey(key);
			return API.v1.success({ inUse });
		},
	)
	.get(
		'abac/rooms',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-rooms'],
			response: {
				200: GETAbacRoomsResponseValidator,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
			query: GETAbacRoomsListQueryValidator,
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { filter, filterType } = this.queryParams;

			const result = await Abac.listAbacRooms(
				{
					offset,
					count,
					filter,
					filterType,
				},
				getActorFromUser(this.user),
			);

			return API.v1.success(result);
		},
	)
	.get(
		'abac/pdp/health',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-settings'],
			rateLimiterOptions: {
				numRequestsAllowed: 5,
				intervalTimeInMS: 60000,
			},
			response: {
				200: GETAbacPdpHealthResponseSchema,
				400: GETAbacPdpHealthErrorResponseSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			try {
				await Abac.getPDPHealth();
				return API.v1.success({ available: true, message: 'ABAC_PDP_Health_OK' });
			} catch (err) {
				return API.v1.failure({ available: false, message: getPdpHealthErrorCode(err) });
			}
		},
	)
	.get(
		'abac/audit',
		{
			response: {
				200: GETAbacAuditEventsResponseSchema,
				400: GenericErrorSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateUnauthorizedErrorResponse,
			},
			query: GETAbacAuditEventsQuerySchema,
			authRequired: true,
			permissionsRequired: ['abac-management', 'view-abac-admin-audit'],
			license: ['abac', 'auditing'],
		},
		async function action() {
			const { start, end, actor } = this.queryParams;

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const _sort = { ts: sort?.ts ? sort?.ts : -1 };

			const { cursor, totalCount } = ServerEvents.findPaginated(
				{
					...(actor && convertSubObjectsIntoPaths({ actor })),
					ts: {
						$gte: start ? new Date(start) : new Date(0),
						$lte: end ? new Date(end) : new Date(),
					},
					t: {
						$in: [
							'abac.attribute.changed',
							'abac.object.attribute.changed',
							'abac.object.attributes.removed',
							'abac.action.performed',
							'abac.attribute.store.switched',
						],
					},
				},
				{
					sort: _sort,
					skip: offset,
					limit: count,
					allowDiskUse: true,
				},
			);

			const [events, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				events: events as (
					| IServerEvents['abac.action.performed']
					| IServerEvents['abac.attribute.changed']
					| IServerEvents['abac.object.attribute.changed']
					| IServerEvents['abac.object.attributes.removed']
					| IServerEvents['abac.attribute.store.switched']
				)[],
				count: events.length,
				offset,
				total,
			});
		},
	)

	.get(
		'abac/attribute-keys',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-settings'],
			license: ['abac'],
			response: {
				200: GETAbacAttributeKeysResponseSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const keys = (await Abac.listAbacAttributeKeys(getActorFromUser(this.user))).sort((a, b) => a.localeCompare(b));

			return API.v1.success({ data: keys.map((key) => ({ key, label: key })) });
		},
	)

	.get(
		'abac/config',
		{
			authRequired: true,
			license: ['abac'],
			response: {
				200: GETAbacConfigResponseSchema,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			return API.v1.success({
				bannersConfig: settings.get<string>('ABAC_Classification_Banners_Config'),
				requiredAttributes: settings.get<string[]>('ABAC_Required_Attributes'),
			});
		},
	)
	.get(
		'abac/assignable-attributes',
		{
			authRequired: true,
			license: ['abac'],
			query: GETAbacAssignableAttributesQuerySchema,
			response: {
				200: GETAbacAssignableAttributesResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { rid } = this.queryParams;

			if (rid) {
				const grant = await getRoomAttributesGrant(this.userId, rid);
				if (!grant) {
					return forbidden();
				}

				if (!settings.get('ABAC_Enabled')) {
					throw new Error('error-abac-not-enabled');
				}

				return API.v1.success({ attributes: await Abac.listRoomAssignableAttributes(rid, toAbacActor(this.user), grant) });
			}

			if (!(await hasPermissionAsync(this.userId, 'create-abac-managed-room'))) {
				return forbidden();
			}

			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			return API.v1.success({ attributes: await Abac.listAssignableAttributes(toAbacActor(this.user)) });
		},
	)
	.post(
		'abac/attribute-assignability',
		{
			authRequired: true,
			permissionsRequired: ['create-abac-managed-room'],
			license: ['abac'],
			body: POSTAbacAttributeAssignabilityBodySchema,
			response: {
				200: GenericSuccessSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			const result = await Abac.validateCreationAttributes(
				toAbacAttributeDefinitions(this.bodyParams.attributes) ?? [],
				toAbacActor(this.user),
				{ creatorJoins: true },
			);
			if (!result.allowed) {
				throw toCreationAttributesDenialError(result);
			}

			return API.v1.success();
		},
	)

	.post(
		'abac/membership-preview',
		{
			authRequired: true,
			license: ['abac'],
			body: POSTAbacMembershipPreviewBodySchema,
			response: {
				200: POSTAbacMembershipPreviewResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { bodyParams } = this;

			if ('rid' in bodyParams) {
				const { rid, attributes, filter, after, group } = bodyParams;
				const grant = await getRoomAttributesGrant(this.userId, rid);
				if (!grant) {
					return forbidden();
				}

				if (!settings.get('ABAC_Enabled')) {
					throw new Error('error-abac-not-enabled');
				}

				const { count } = await getPaginationItems(bodyParams);

				return API.v1.success(
					await Abac.previewRoomMembers(rid, attributes, toAbacActor(this.user), { filter, after, count, group }, grant),
				);
			}

			if (!(await hasPermissionAsync(this.userId, 'create-abac-managed-room'))) {
				return forbidden();
			}

			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			const { members, attributes } = bodyParams;
			if (members.length + 1 > settings.get<number>('API_User_Limit')) {
				throw new Error('error-abac-preview-too-many-members');
			}

			const result = await Abac.previewCreationMembers(members, toAbacAttributeDefinitions(attributes) ?? [], toAbacActor(this.user));
			if (!result.allowed) {
				throw toCreationAttributesDenialError(result);
			}

			return API.v1.success(result.preview);
		},
	);

export type AbacEndpoints = ExtractRoutesFromAPI<typeof abacEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends AbacEndpoints {}
}
