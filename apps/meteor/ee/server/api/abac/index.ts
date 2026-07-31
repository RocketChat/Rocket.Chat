import { AbacAttributeStoreExternalError, getPdpHealthErrorCode } from '@rocket.chat/abac';
import { Abac } from '@rocket.chat/core-services';
import type { AbacActor } from '@rocket.chat/core-services';
import type { IServerEvents, IUser } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';
import { validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings/src/v1/Ajv';
import { convertSubObjectsIntoPaths } from '@rocket.chat/tools';

import { abacExamples } from './index.examples';
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
			summary: 'Replace room ABAC attributes',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Replaces the full ABAC attribute set for a room.
- Sets the complete set of ABAC attributes on the specified room by providing an attributes object that maps attribute keys to arrays of allowed values; any previously assigned attributes not included in the request are removed.
- Requires the ABAC license, the \`abac-management\` and \`manage-abac-admin-rooms\` permissions, and the global setting \`ABAC_Enabled\` to be turned on.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-rooms\` granular permission requirement. |`,
			examples: abacExamples['abac/rooms/:rid/attributes'],
			tags: ['ABAC'],
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
			summary: 'Delete all ABAC attributes',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Clears all ABAC attributes from a room.
- Removes every ABAC attribute key and value currently assigned to the specified room, leaving it with no ABAC attributes configured.
- Requires the \`abac-management\` and \`manage-abac-admin-rooms\` permissions. This call does not require the global setting \`ABAC_Enabled\` to be on, so attributes can be cleared after disabling ABAC.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-rooms\` granular permission requirement. |`,
			examples: abacExamples['abac/rooms/:rid/attributes'],
			tags: ['ABAC'],
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
			summary: 'Add ABAC attribute key to room',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Adds a single ABAC attribute key to a room.
- Creates a new ABAC attribute on the specified room for the given key, assigning it the provided values array; fails if the room already has this key or if the key/values are not allowed by the global attribute definition.
- Requires the ABAC license, the \`abac-management\` and \`manage-abac-admin-rooms\` permissions, and the global setting \`ABAC_Enabled\` to be turned on.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-rooms\` granular permission requirement. |`,
			examples: abacExamples['abac/rooms/:rid/attributes/:key'],
			tags: ['ABAC'],
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
			summary: 'Set room ABAC attribute values',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Sets the values of a single ABAC attribute on a room.
- Replaces the existing values for the given attribute key on the specified room with the provided values array (or creates the attribute if it does not yet exist), enforcing the global attribute definition and ABAC validation rules.
- Requires the ABAC license, the \`abac-management\` and \`manage-abac-admin-rooms\` permissions, and the global setting \`ABAC_Enabled\` to be turned on.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-rooms\` granular permission requirement. |`,
			examples: abacExamples['abac/rooms/:rid/attributes/:key'],
			tags: ['ABAC'],
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
			summary: 'Delete room ABAC attribute key',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Removes a single ABAC attribute key from a room.
- Deletes the specified attribute key and all its values from the room's ABAC configuration, leaving other attributes unchanged.
- Requires the \`abac-management\` and \`manage-abac-admin-rooms\` permissions.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-rooms\` granular permission requirement. |`,
			examples: abacExamples['abac/rooms/:rid/attributes/:key'],
			tags: ['ABAC'],
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
			summary: 'List ABAC attribute definitions',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Lists all ABAC attribute definitions.
- Returns a paginated list of attribute definitions (key and allowed values).
- Supports optional filtering by attribute key or value, and pagination via offset and count query parameters.
- Requires the \`abac-management\` and \`manage-abac-admin-room-attributes\` permissions.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-room-attributes\` granular permission requirement. |`,
			examples: abacExamples['abac/attributes'],
			tags: ['ABAC'],
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
			summary: 'Sync users ABAC attributes from LDAP',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Syncs ABAC attributes for specified users from LDAP.
- Refreshes user ABAC attributes by reading current data from LDAP and applying the configured LDAP → ABAC attribute mapping.
- Users can be identified by usernames, ids, emails, or ldapIds.
- Requires the LDAP Enterprise and ABAC licenses, the \`abac-management\` and \`manage-abac-admin-room-attributes\` permissions, and the global setting \`ABAC_Enabled\` to be turned on.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-room-attributes\` granular permission requirement. |`,
			examples: abacExamples['abac/users/sync'],
			tags: ['ABAC'],
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
			summary: 'Create ABAC attribute definition',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Creates a new ABAC attribute definition.
- Registers a global ABAC attribute by specifying its key and the list of allowed values, making it available for use on rooms and users.
- Requires the ABAC license, the \`abac-management\` and \`manage-abac-admin-room-attributes\` permissions, and the global setting \`ABAC_Enabled\` to be turned on.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-room-attributes\` granular permission requirement. |`,
			examples: abacExamples['abac/attributes'],
			tags: ['ABAC'],
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
			summary: 'Update ABAC attribute definition',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Updates an existing ABAC attribute definition.
- Modifies the attribute identified by \`_id\`, allowing you to rename its key, change its list of allowed values, or both, subject to in-use and validation checks.
- Requires the ABAC license, the \`abac-management\` and \`manage-abac-admin-room-attributes\` permissions, and the global setting \`ABAC_Enabled\` to be turned on.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-room-attributes\` granular permission requirement. |`,
			examples: abacExamples['abac/attributes/:_id'],
			tags: ['ABAC'],
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
			summary: 'Get ABAC attribute definition by ID',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Retrieves a single ABAC attribute definition by ID.
- Returns the attribute key and its allowed values for the definition identified by \`_id\`.
- Requires the \`abac-management\` and \`manage-abac-admin-room-attributes\` permissions.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-room-attributes\` granular permission requirement. |`,
			examples: abacExamples['abac/attributes/:_id'],
			tags: ['ABAC'],
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
			summary: 'Delete ABAC attribute definition by ID',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Deletes an ABAC attribute definition by ID.
- Removes the attribute definition identified by \`_id\`. The delete fails if the attribute is currently in use, for example assigned to any room.
- Requires the \`abac-management\` and \`manage-abac-admin-room-attributes\` permissions.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-room-attributes\` granular permission requirement. |`,
			examples: abacExamples['abac/attributes/:_id'],
			tags: ['ABAC'],
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
			summary: 'Check if ABAC attribute is in use',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Checks whether an ABAC attribute definition is currently used by any room.
- Requires the \`abac-management\` and \`manage-abac-admin-room-attributes\` permissions.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-room-attributes\` granular permission requirement. |`,
			examples: abacExamples['abac/attributes/:key/is-in-use'],
			tags: ['ABAC'],
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
			summary: 'List rooms with ABAC attributes',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Lists rooms with ABAC attributes.
- Returns a paginated list of rooms that have ABAC attributes configured, with optional filtering by room name, attribute key, or attribute value using the \`filter\` and \`filterType\` query parameters.
- Requires the \`abac-management\` and \`manage-abac-admin-rooms\` permissions.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-rooms\` granular permission requirement. |`,
			examples: abacExamples['abac/rooms'],
			tags: ['ABAC'],
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
		'abac/pdp/health',
		{
			summary: 'Get PDP Health Status',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

Checks the health and availability of the configured Policy Decision Point (PDP)
for Attribute-Based Access Control (ABAC).

This endpoint is used by administrators to verify that the external PDP service
is operational and properly configured. It includes rate limiting to prevent abuse.

Permissions required: \`abac-management\` and \`manage-abac-admin-settings\`.

### Changelog
| Version | Change |
|---------|--------|
| 8.0.0   | Added |
| 8.5.0   | Added the \`manage-abac-admin-settings\` granular permission requirement. |
| 8.4.0   | Added endpoint to check external PDP health status |`,
			examples: abacExamples['abac/pdp/health'],
			tags: ['ABAC'],
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
			summary: 'List ABAC audit events',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Defense.svg" alt="Defense" style="display: block; margin: auto"></div>

- Lists ABAC audit events.
- Returns a paginated audit log of ABAC-related actions (attribute changes, room attribute changes/removals, and ABAC actions), filterable by time range (\`start\`, \`end\`) and optional \`actor\`, with optional sorting.
- Requires the ABAC and Auditing licenses, the \`abac-management\` and \`view-abac-admin-audit\` permissions.

### Changelog
| Version | Description |
| ------- | ----------- |
| 8.0.0   | Added |
| 8.5.0   | Added the \`view-abac-admin-audit\` granular permission requirement. |`,
			examples: abacExamples['abac/audit'],
			tags: ['ABAC'],
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
	);

export type AbacEndpoints = ExtractRoutesFromAPI<typeof abacEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends AbacEndpoints {}
}
