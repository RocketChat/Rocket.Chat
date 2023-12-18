import { LivechatTrigger } from '@rocket.chat/models';
import { isGETLivechatTriggersParams, isPOSTLivechatTriggersParams } from '@rocket.chat/rest-typings';
import { isLivechatTriggerWebhookTestParams } from '@rocket.chat/rest-typings/src/v1/omnichannel';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { settings } from '../../../../settings/server';
import { findTriggers, findTriggerById, deleteTrigger } from '../../../server/api/lib/triggers';

API.v1.addRoute(
	'livechat/triggers',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: {
			GET: isGETLivechatTriggersParams,
			POST: isPOSTLivechatTriggersParams,
		},
	},
	{
		async get() {
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
		async post() {
			const { _id, name, description, enabled, runOnce, conditions, actions } = this.bodyParams;

			if (_id) {
				await LivechatTrigger.updateById(_id, { name, description, enabled, runOnce, conditions, actions });
			} else {
				await LivechatTrigger.insertOne({ name, description, enabled, runOnce, conditions, actions });
			}

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/triggers/webhook-test',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isLivechatTriggerWebhookTestParams },
	{
		async post() {
			const { webhookUrl, timeout, fallbackMessage, params: clientParams } = this.bodyParams;

			const token = settings.get<string>('Livechat_secret_token');

			if (!token) {
				throw new Error('Livechat secret token is not configured');
			}

			const body = {
				...clientParams,
				visitorToken: '1234567890',
			};

			const headers = {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-RocketChat-Livechat-Token': token,
			};

			try {
				const response = await fetch(webhookUrl, { timeout, body, headers, method: 'POST' });
				const text = await response.text();

				if (!response.ok || response.status !== 200) {
					throw new Error(text);
				}

				return API.v1.success({ response: text });
			} catch (error: any) {
				const isTimeout = error.message === 'The user aborted a request.';
				return API.v1.failure({
					error: isTimeout ? 'timeout-error' : 'error-invalid-webhook-response',
					response: error.message,
					fallbackMessage,
				});
			}
		},
	},
);

API.v1.addRoute(
	'livechat/triggers/:_id',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const trigger = await findTriggerById({
				triggerId: this.urlParams._id,
			});

			return API.v1.success({
				trigger,
			});
		},
		async delete() {
			await deleteTrigger({
				triggerId: this.urlParams._id,
			});

			return API.v1.success();
		},
	},
);
