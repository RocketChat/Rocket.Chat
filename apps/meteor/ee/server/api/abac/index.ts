import { Abac } from '@rocket.chat/core-services';

import { GenericSuccessSchema, POSTAbacAttributeDefinitionSchema } from './schemas';
import { API } from '../../../../app/api/server';
import type { ExtractRoutesFromAPI } from '../../../../app/api/server/ApiClass';

const abacEndpoints = API.v1
	// enable/disable for room
	.post(
		'abac/rooms/:rid',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			response: { 200: GenericSuccessSchema },
			license: ['abac'],
		},
		async function action() {
			const { rid } = this.urlParams;
			await Abac.toggleAbacConfigurationForRoom(rid);

			return API.v1.success();
		},
	)
	// add attributes for a room (bulk)
	.post(
		'abac/room/:rid/attributes',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {},
	)
	// edit a room attribute
	.put(
		'abac/room/:rid/attributes/:key',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {},
	)
	// delete a room attribute
	.delete(
		'abac/room/:rid/attributes/:key',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {},
	)
	// attribute endpoints
	// list attributes
	.get(
		'abac/attributes',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {},
	)
	// create attribute
	.post(
		'abac/attributes',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			license: ['abac'],
			validateParams: POSTAbacAttributeDefinitionSchema,
			response: { 200: GenericSuccessSchema },
		},
		async function action() {
			await Abac.addAbacAttribute(this.bodyParams);
			return API.v1.success();
		},
	)
	// edit attribute and values (do not allow to modify attribute value if in use)
	.put(
		'abac/attributes/:key',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {},
	)
	// delete attribute (only if not in use)
	.delete(
		'abac/attributes/:key',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {},
	)
	// check if attribute is in use
	.get(
		'abac/attributes/:key/is-in-use',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {},
	);

export type AbacEndpoints = ExtractRoutesFromAPI<typeof abacEndpoints>;
