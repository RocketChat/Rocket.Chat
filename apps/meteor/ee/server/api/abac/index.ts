import { Abac } from '@rocket.chat/core-services';
import type { AbacActor } from '@rocket.chat/core-services';
import type { IServerEvents, IUser } from '@rocket.chat/core-typings';
import { ServerEvents, Users } from '@rocket.chat/models';
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
} from './schemas';
import { API } from '../../../../app/api/server';
import type { ExtractRoutesFromAPI } from '../../../../app/api/server/ApiClass';
import { getPaginationItems } from '../../../../app/api/server/helpers/getPaginationItems';
import { settings } from '../../../../app/settings/server';
import { LDAPEE } from '../../sdk';

const getActorFromUser = (user?: IUser | null): AbacActor | undefined =>
	user?._id
		? {
				_id: user._id,
				username: user.username,
				name: user.name,
			}
		: undefined;

const abacEndpoints = API.v1
	.post(
		'abac/rooms/:rid/attributes',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
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
			permissionsRequired: ['abac-management'],
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
			permissionsRequired: ['abac-management'],
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
			permissionsRequired: ['abac-management'],
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
			permissionsRequired: ['abac-management'],
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
			permissionsRequired: ['abac-management'],
			query: GETAbacAttributesQuerySchema,
			response: {
				200: GETAbacAttributesResponseSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | string[] | number | null | undefined>);
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
			permissionsRequired: ['abac-management'],
			license: ['abac', 'ldap-enterprise'],
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

			await LDAPEE.syncUsersAbacAttributes(Users.findUsersByIdentifiers({ usernames, ids, emails, ldapIds }));

			return API.v1.success();
		},
	)
	.post(
		'abac/attributes',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
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

			await Abac.addAbacAttribute(this.bodyParams, getActorFromUser(this.user));
			return API.v1.success();
		},
	)
	// update attribute definition (key and/or values)
	.put(
		'abac/attributes/:_id',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
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

			await Abac.updateAbacAttributeById(_id, this.bodyParams, getActorFromUser(this.user));
			return API.v1.success();
		},
	)
	// get single attribute with usage
	.get(
		'abac/attributes/:_id',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			response: {
				200: GETAbacAttributeByIdResponseSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { _id } = this.urlParams;
			const result = await Abac.getAbacAttributeById(_id, getActorFromUser(this.user));
			return API.v1.success(result);
		},
	)
	// delete attribute (only if not in use)
	.delete(
		'abac/attributes/:_id',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			response: {
				200: GenericSuccessSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { _id } = this.urlParams;
			await Abac.deleteAbacAttributeById(_id, getActorFromUser(this.user));
			return API.v1.success();
		},
	)
	// check if attribute is in use
	.get(
		'abac/attributes/:key/is-in-use',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			response: {
				200: GETAbacAttributeIsInUseResponseSchema,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { key } = this.urlParams;
			const inUse = await Abac.isAbacAttributeInUseByKey(key);
			return API.v1.success({ inUse });
		},
	)
	.get(
		'abac/rooms',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			response: {
				200: GETAbacRoomsResponseValidator,
				401: validateUnauthorizedErrorResponse,
				400: GenericErrorSchema,
				403: validateUnauthorizedErrorResponse,
			},
			query: GETAbacRoomsListQueryValidator,
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | string[] | number | null | undefined>);
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
			permissionsRequired: ['abac-management'],
			license: ['abac', 'auditing'],
		},
		async function action() {
			const { start, end, actor } = this.queryParams;

			const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | number | null | undefined>);
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
						$in: ['abac.attribute.changed', 'abac.object.attribute.changed', 'abac.object.attributes.removed', 'abac.action.performed'],
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
				)[],
				count: events.length,
				offset,
				total,
			});
		},
	);

export type AbacEndpoints = ExtractRoutesFromAPI<typeof abacEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends AbacEndpoints {}
}
