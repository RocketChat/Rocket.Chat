import { Abac } from '@rocket.chat/core-services';

import {
	GenericSuccessSchema,
	PUTAbacAttributeUpdateBodySchema,
	GETAbacAttributesQuerySchema,
	GETAbacAttributesResponseSchema,
	POSTAbacAttributeDefinitionSchema,
} from './schemas';
import { API } from '../../../../app/api/server';
import type { ExtractRoutesFromAPI } from '../../../../app/api/server/ApiClass';
import { settings } from '../../../../app/settings/server';

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

			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			const attributes = await Abac.listAbacAttributes({
				key,
				values,
				offset,
				count,
			});

			return API.v1.success(attributes);
		},
	)
	// get an attribute by id
	.get(
		'abac/attributes/:_id',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {
			throw new Error('not-implemented');
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
			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			await Abac.addAbacAttribute(this.bodyParams);
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
			response: { 200: GenericSuccessSchema },
		},
		async function action() {
			const { _id } = this.urlParams;
			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			await Abac.updateAbacAttributeById(_id, this.bodyParams);
			return API.v1.success();
		},
	)
	// delete attribute (only if not in use)
	.delete(
		'abac/attributes/:_id',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			response: { 200: GenericSuccessSchema },
			license: ['abac'],
		},
		async function action() {
			const { _id } = this.urlParams;
			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}
			await Abac.deleteAbacAttributeById(_id);
			return API.v1.success();
		},
	)
	// check if attribute is in use
	.get(
		'abac/attributes/:key/is-in-use',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: {}, license: ['abac'] },
		async function action() {
			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}
			throw new Error('not-implemented');
		},
	);

export type AbacEndpoints = ExtractRoutesFromAPI<typeof abacEndpoints>;
