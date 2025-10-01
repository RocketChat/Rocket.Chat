import { Abac } from '@rocket.chat/core-services';

import {
	GenericSuccessSchema,
	POSTAbacAttributeDefinitionSchema,
	GETAbacAttributesQuerySchema,
	GETAbacAttributesResponseSchema,
} from './schemas';
import { API } from '../../../../app/api/server';
import type { ExtractRoutesFromAPI } from '../../../../app/api/server/ApiClass';

const abacEndpoints = API.v1
	// add attributes for a room (bulk)
	.post(
		'abac/room/:rid/attributes',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {
			throw new Error('not-implemented');
		},
	)
	// edit a room attribute
	.put(
		'abac/room/:rid/attributes/:key',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {
			throw new Error('not-implemented');
		},
	)
	// delete a room attribute
	.delete(
		'abac/room/:rid/attributes/:key',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {
			throw new Error('not-implemented');
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
			response: { 200: GETAbacAttributesResponseSchema },
			license: ['abac'],
		},
		async function action() {
			const { key, values, offset, count } = this.queryParams;

			const attributes = await Abac.listAbacAttributes({
				key,
				values,
				offset,
				count,
			});

			return API.v1.success(attributes);
		},
	)
	// create attribute
	.post(
		'abac/attributes',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			license: ['abac'],
			body: POSTAbacAttributeDefinitionSchema,
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
		async function action() {
			throw new Error('not-implemented');
		},
	)
	// delete attribute (only if not in use)
	.delete(
		'abac/attributes/:key',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {
			throw new Error('not-implemented');
		},
	)
	// check if attribute is in use
	.get(
		'abac/attributes/:key/is-in-use',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {
			throw new Error('not-implemented');
		},
	);

export type AbacEndpoints = ExtractRoutesFromAPI<typeof abacEndpoints>;
