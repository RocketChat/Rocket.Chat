import { Abac } from '@rocket.chat/core-services';

import {
	GenericSuccessSchema,
	PUTAbacAttributeUpdateBodySchema,
	GETAbacAttributesQuerySchema,
	GETAbacAttributesResponseSchema,
	GETAbacAttributeByIdResponseSchema,
	POSTAbacAttributeDefinitionSchema,
	GETAbacAttributeIsInUseResponseSchema,
	POSTRoomAbacAttributesBodySchema,
	PUTRoomAbacAttributeValuesBodySchema,
} from './schemas';
import { API } from '../../../../app/api/server';
import type { ExtractRoutesFromAPI } from '../../../../app/api/server/ApiClass';
import { settings } from '../../../../app/settings/server';

const abacEndpoints = API.v1
	.post(
		'abac/room/:rid/attributes',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			body: POSTRoomAbacAttributesBodySchema,
			response: { 200: GenericSuccessSchema },
		},
		async function action() {
			const { rid } = this.urlParams;
			const { attributes } = this.bodyParams;

			if (!settings.get('ABAC_Enabled') && Object.keys(attributes).length) {
				throw new Error('error-abac-not-enabled');
			}

			await Abac.setRoomAbacAttributes(rid, attributes);
			return API.v1.success();
		},
	)
	// edit a room attribute
	.put(
		'abac/room/:rid/attributes/:key',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			body: PUTRoomAbacAttributeValuesBodySchema,
			response: { 200: GenericSuccessSchema },
			license: ['abac'],
		},
		async function action() {
			const { rid, key } = this.urlParams;
			const { values } = this.bodyParams;

			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			await Abac.replaceRoomAbacAttributeByKey(rid, key, values);
			return API.v1.success();
		},
	)
	// delete a room attribute
	.delete(
		'abac/room/:rid/attributes/:key',
		{ authRequired: true, permissionsRequired: ['abac-management'], response: { 200: GenericSuccessSchema } },
		async function action() {
			const { rid, key } = this.urlParams;

			await Abac.removeRoomAbacAttribute(rid, key);
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
			response: { 200: GETAbacAttributesResponseSchema },
			license: ['abac'],
		},
		async function action() {
			const { key, values, offset, count } = this.queryParams;

			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}

			return API.v1.success(
				await Abac.listAbacAttributes({
					key,
					values,
					offset,
					count,
				}),
			);
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
	// get single attribute with usage
	.get(
		'abac/attributes/:_id',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			response: { 200: GETAbacAttributeByIdResponseSchema },
			license: ['abac'],
		},
		async function action() {
			const { _id } = this.urlParams;
			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}
			const result = await Abac.getAbacAttributeById(_id);
			return API.v1.success(result);
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
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			response: { 200: GETAbacAttributeIsInUseResponseSchema },
			license: ['abac'],
		},
		async function action() {
			const { key } = this.urlParams;
			if (!settings.get('ABAC_Enabled')) {
				throw new Error('error-abac-not-enabled');
			}
			const inUse = await Abac.isAbacAttributeInUseByKey(key);
			return API.v1.success({ inUse });
		},
	);

export type AbacEndpoints = ExtractRoutesFromAPI<typeof abacEndpoints>;
