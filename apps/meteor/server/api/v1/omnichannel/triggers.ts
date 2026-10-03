import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import { LivechatTrigger } from '@rocket.chat/models';
import {
	ajv,
	isGETLivechatTriggersParams,
	isPOSTLivechatTriggersParams,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { deleteTrigger, findTriggerById, findTriggers } from './lib/triggers';
import type { ExtractRoutesFromAPI } from '../../ApiClass';
import { API } from '../../api';
import { getPaginationItems } from '../../lib/getPaginationItems';

const livechatTriggerSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		_updatedAt: { type: 'string', format: 'date-time' },
		_createdAt: { type: 'string', format: 'date-time' },
		name: { type: 'string' },
		description: { type: 'string' },
		enabled: { type: 'boolean' },
		runOnce: { type: 'boolean' },
		conditions: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					value: { oneOf: [{ type: 'string' }, { type: 'number' }] },
				},
				required: ['name'],
				additionalProperties: false,
			},
		},
		actions: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					params: {
						type: 'object',
						additionalProperties: true,
					},
				},
				required: ['name'],
				additionalProperties: false,
			},
		},
	},
	required: ['_id', 'name', 'enabled', 'runOnce', 'conditions', 'actions'],
	additionalProperties: false,
};

const triggersListResponseSchema = ajv.compile<{
	triggers: ILivechatTrigger[];
	count: number;
	offset: number;
	total: number;
	success: true;
}>({
	type: 'object',
	properties: {
		triggers: {
			type: 'array',
			items: livechatTriggerSchema,
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['triggers', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const triggerItemResponseSchema = ajv.compile<{ trigger: ILivechatTrigger | null; success: true }>({
	type: 'object',
	properties: {
		trigger: {
			oneOf: [livechatTriggerSchema, { type: 'null' }],
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['trigger', 'success'],
	additionalProperties: false,
});

const triggerVoidResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const livechatTriggersEndpoints = API.v1
	.get(
		'livechat/triggers',
		{
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'],
			query: isGETLivechatTriggersParams,
			response: {
				200: triggersListResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const triggers = await findTriggers({
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(triggers);
		},
	)
	.post(
		'livechat/triggers',
		{
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'],
			body: isPOSTLivechatTriggersParams,
			response: {
				200: triggerVoidResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { _id, name, description, enabled, runOnce, conditions, actions } = this.bodyParams;

			if (_id) {
				await LivechatTrigger.updateById(_id, { name, description, enabled, runOnce, conditions, actions });
			} else {
				await LivechatTrigger.insertOne({ name, description, enabled, runOnce, conditions, actions });
			}

			return API.v1.success();
		},
	)
	.get(
		'livechat/triggers/:_id',
		{
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'],
			response: {
				200: triggerItemResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const trigger = await findTriggerById({
				triggerId: this.urlParams._id,
			});

			return API.v1.success({
				trigger,
			});
		},
	)
	.delete(
		'livechat/triggers/:_id',
		{
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'],
			response: {
				200: triggerVoidResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			await deleteTrigger({
				triggerId: this.urlParams._id,
			});

			return API.v1.success();
		},
	);

type LivechatTriggersEndpoints = ExtractRoutesFromAPI<typeof livechatTriggersEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface Endpoints extends LivechatTriggersEndpoints {}
}
