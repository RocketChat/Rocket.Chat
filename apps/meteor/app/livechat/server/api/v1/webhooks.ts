import { Logger } from '@rocket.chat/logger';
import { ajv, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';
import type { ExtendedFetchOptions } from '@rocket.chat/server-fetch';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { API } from '../../../../api/server';
import type { ExtractRoutesFromAPI } from '../../../../api/server/ApiClass';
import { settings } from '../../../../settings/server';

const logger = new Logger('WebhookTest');

const livechatWebhookEndpoints = API.v1.post(
	'livechat/webhook.test',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-webhooks'],
		response: {
			401: validateUnauthorizedErrorResponse,
			200: ajv.compile<void>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [true] },
				},
				required: ['success'],
			}),
		},
	},
	async function action() {
		const sampleData = {
			type: 'LivechatSession',
			_id: 'fasd6f5a4sd6f8a4sdf',
			label: 'title',
			topic: 'asiodojf',
			createdAt: new Date(),
			lastMessageAt: new Date(),
			tags: ['tag1', 'tag2', 'tag3'],
			customFields: {
				productId: '123456',
			},
			visitor: {
				_id: '',
				name: 'visitor name',
				username: 'visitor-username',
				department: 'department',
				email: 'email@address.com',
				phone: '192873192873',
				ip: '123.456.7.89',
				browser: 'Chrome',
				os: 'Linux',
				customFields: {
					customerId: '123456',
				},
			},
			agent: {
				_id: 'asdf89as6df8',
				username: 'agent.username',
				name: 'Agent Name',
				email: 'agent@email.com',
			},
			messages: [
				{
					username: 'visitor-username',
					msg: 'message content',
					ts: new Date(),
				},
				{
					username: 'agent.username',
					agentId: 'asdf89as6df8',
					msg: 'message content from agent',
					ts: new Date(),
				},
			],
		};
		const options = {
			method: 'POST',
			headers: {
				'X-RocketChat-Livechat-Token': settings.get<string>('Livechat_secret_token'),
				'Accept': 'application/json',
			},
			body: sampleData,
			ignoreSsrfValidation: true,
			size: 10 * 1024 * 1024,
		} as ExtendedFetchOptions;

		const webhookUrl = settings.get<string>('Livechat_webhookUrl');

		if (!webhookUrl) {
			return API.v1.failure('Webhook_URL_not_set');
		}

		try {
			logger.debug({ msg: 'Testing webhook', host: new URL(webhookUrl).host });
			const request = await fetch(webhookUrl, options);
			const response = await request.text();

			logger.debug({ msg: 'Webhook response', status: request.status });
			if (request.status === 200) {
				return API.v1.success();
			}

			throw new Error('Invalid status code');
		} catch (error) {
			logger.error({ msg: 'Error testing webhook', err: error });
			throw new Error('error-invalid-webhook-response');
		}
	},
);

type LivechatWebhookEndpoints = ExtractRoutesFromAPI<typeof livechatWebhookEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatWebhookEndpoints { }
}
