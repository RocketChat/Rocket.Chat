import { isExternalServiceTrigger } from '@rocket.chat/core-typings';
import { LivechatTrigger } from '@rocket.chat/models';
import { isGETLivechatTriggersParams, isPOSTLivechatTriggersParams, isLivechatTriggerWebhookCallParams } from '@rocket.chat/rest-typings';
import { isLivechatTriggerWebhookTestParams } from '@rocket.chat/rest-typings/src/v1/omnichannel';

import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { settings } from '../../../../settings/server';
import { findTriggers, findTriggerById, deleteTrigger, callTriggerExternalService } from '../../../server/api/lib/triggers';

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
	'livechat/triggers/external-service/test',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatTriggerWebhookTestParams,
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
	},
	{
		async post() {
			const { webhookUrl, timeout, fallbackMessage, extraData: clientParams } = this.bodyParams;

			const token = settings.get<string>('Livechat_secret_token');

			if (!token) {
				throw new Error('Livechat secret token is not configured');
			}

			const body = {
				metadata: clientParams,
				visitorToken: '1234567890',
			};

			const headers = {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-RocketChat-Livechat-Token': token,
			};

			const response = await callTriggerExternalService({
				url: webhookUrl,
				timeout,
				fallbackMessage,
				body,
				headers,
			});

			if (response.error) {
				return API.v1.failure({
					triggerId: 'test-trigger',
					...response,
				});
			}

			return API.v1.success({
				triggerId: 'test-trigger',
				...response,
			});
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

API.v1.addRoute(
	'livechat/triggers/:_id/external-service/call',
	{
		authRequired: false,
		rateLimiterOptions: {
			numRequestsAllowed: 1,
			intervalTimeInMS: 60000,
		},
		validateParams: isLivechatTriggerWebhookCallParams,
	},
	{
		async post() {
			const { _id: triggerId } = this.urlParams;
			const { token: visitorToken, extraData } = this.bodyParams;

			const trigger = await findTriggerById({
				triggerId,
			});

			if (!trigger) {
				throw new Error('Invalid trigger');
			}

			if (!trigger?.actions.length || !isExternalServiceTrigger(trigger)) {
				throw new Error('Trigger is not configured to use an external service');
			}

			const { params: { serviceTimeout = 5000, serviceUrl, serviceFallbackMessage = 'trigger-default-fallback-message' } = {} } =
				trigger.actions[0];

			if (!serviceUrl) {
				throw new Error('Invalid service URL');
			}

			const token = settings.get<string>('Livechat_secret_token');

			if (!token) {
				throw new Error('Livechat secret token is not configured');
			}

			const body = {
				metadata: extraData,
				visitorToken,
			};

			const headers = {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-RocketChat-Livechat-Token': token,
			};

			const response = await callTriggerExternalService({
				url: serviceUrl,
				timeout: serviceTimeout,
				fallbackMessage: serviceFallbackMessage,
				body,
				headers,
			});

			if (response.error) {
				return API.v1.failure({
					triggerId,
					...response,
				});
			}

			return API.v1.success({
				triggerId,
				...response,
			});
		},
	},
);
