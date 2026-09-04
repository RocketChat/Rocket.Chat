import { AbacAttributeStoreExternalError, getPdpHealthErrorCode } from '@rocket.chat/abac';
import { Abac } from '@rocket.chat/core-services';
import type { AbacActor } from '@rocket.chat/core-services';
import type { IServerEvents, IUser } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';
import { validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings/src/v1/Ajv';
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
	POSTAbacAttributeAssignabilityBodySchema,
	POSTAbacMembershipPreviewBodySchema,
	POSTAbacMembershipPreviewResponseSchema,
} from './schemas';
import { API } from '../../../../server/api';
import type { ExtractRoutesFromAPI } from '../../../../server/api/ApiClass';
import { getPaginationItems } from '../../../../server/api/lib/getPaginationItems';
import { settings } from '../../../../server/settings';

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

const abacEndpoints = API.v1
	.post(
		'abac/rooms/:rid/attributes',
		{
			authRequired: true,
			permissionsRequired: ['abac-management', 'manage-abac-admin-rooms'],
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

			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			// This is a replace-all operation
			// IF you need fine grained, use the other endpoints for removing, editing & adding single attributes
			await Abac.setRoomAbacAttributes(rid, attributes, getActorFromUser(this.user));
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
			permissionsRequired: ['manage-abac-admin-settings'],
			license: ['abac'],
			response: {
				200: GETAbacAttributeKeysResponseSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			// Option source for the `ABAC_Required_Attributes` multiLookup setting. Returns keys only —
			// the required-attribute set is expressed in keys, not key/value pairs. Scoped by actor, so
			// under an external attribute store an admin sees only the keys they possess.
			const actor = getActorFromUser(this.user);
			const PAGE = 150;
			const MAX_PAGES = 20;

			const keys: string[] = [];
			let offset = 0;

			for (let page = 0; page < MAX_PAGES; page++) {
				const { attributes, total } = await Abac.listAbacAttributes({ offset, count: PAGE }, actor);
				keys.push(...attributes.map(({ key }) => key));
				offset += PAGE;

				if (offset >= total || attributes.length === 0) {
					break;
				}
			}

			const data = [...new Set(keys)].sort((a, b) => a.localeCompare(b)).map((key) => ({ key, label: key }));

			return API.v1.success({ data });
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
				400: GenericErrorSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			// ABAC-P4 §7.2 — a dry run. Deliberately no `permissionsRequired`: the three surfaces that
			// call this are governed by different entitlements (the creation flow by the creator's own
			// authority, the room panel by `edit-room-abac-attributes`, the admin panel by
			// `manage-abac-admin-rooms`), so authorization is enforced per-surface. What guards this
			// endpoint is that it only ever reads, and only about rooms the caller names.
			//
			// TODO(ABAC-P4/D14): once M3 wires the room-side editor, tighten this to require either
			// `edit-room-abac-attributes` on `rid` or `manage-abac-admin-rooms`.
			const { rid, memberIds, memberUsernames, attributes, offset, count } = this.bodyParams;

			const actor = getActorFromUser(this.user);
			if (!actor) {
				return API.v1.unauthorized();
			}

			const definitions = Object.entries(attributes).map(([key, values]) => ({ key, values }));

			const target = ((): { rid: string } | { memberUsernames: string[] } | { memberIds: string[] } => {
				if (rid) {
					return { rid };
				}
				if (memberUsernames) {
					return { memberUsernames };
				}
				return { memberIds: memberIds ?? [] };
			})();

			const preview = await Abac.previewMembersAgainstAttributes(target, definitions, actor, { offset, count });

			return API.v1.success(preview);
		},
	)

	.post(
		'abac/attribute-assignability',
		{
			authRequired: true,
			license: ['abac'],
			body: POSTAbacAttributeAssignabilityBodySchema,
			response: {
				200: GenericSuccessSchema,
				400: GenericErrorSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			// ABAC-P4 M2 — run before creating anything, so a PDP denial is reported while the user is
			// still in the flow rather than after a room already exists. Reuses the validation the
			// commit path applies; the thrown error carries the offending attribute.
			const actor = getActorFromUser(this.user);
			if (!actor) {
				return API.v1.unauthorized();
			}

			const definitions = Object.entries(this.bodyParams.attributes).map(([key, values]) => ({ key, values }));

			await Abac.assertCanAssignAttributes(definitions, actor);

			return API.v1.success();
		},
	);

export type AbacEndpoints = ExtractRoutesFromAPI<typeof abacEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends AbacEndpoints {}
}
