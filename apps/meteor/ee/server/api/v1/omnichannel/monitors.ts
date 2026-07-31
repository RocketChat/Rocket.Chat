import type { ILivechatMonitor } from '@rocket.chat/core-typings';
import {
	isPOSTLivechatMonitorCreateRequest,
	isPOSTLivechatMonitorsDeleteRequest,
	POSTLivechatMonitorsCreateSuccessResponse,
	POSTLivechatMonitorsDeleteSuccessResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { findMonitors, findMonitorByUsername } from './lib/monitors';
import { monitorsExamples } from './monitors.examples';
import { API } from '../../../../../server/api';
import type { ExtractRoutesFromAPI } from '../../../../../server/api/ApiClass';
import { getPaginationItems } from '../../../../../server/api/lib/getPaginationItems';
import { LivechatEnterprise } from '../../../lib/omnichannel/LivechatEnterprise';

API.v1.addRoute(
	'livechat/monitors',
	{
		authRequired: true,
		permissionsRequired: ['manage-livechat-monitors'],
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { text } = this.queryParams;

			return API.v1.success(
				await findMonitors({
					text,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/monitors/:username',
	{
		authRequired: true,
		permissionsRequired: ['manage-livechat-monitors'],
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { username } = this.urlParams;

			return API.v1.success(
				(await findMonitorByUsername({
					username,
				})) as unknown as ILivechatMonitor,
			);
		},
	},
);

const livechatMonitorsEndpoints = API.v1
	.post(
		'livechat/monitors.create',
		{
			summary: 'Create a Monitor',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Enterprise%20tag.svg" alt="Enterprise" style="display: block; margin: auto;"></div>

Add a user as monitor. Permission required: \`manage-livechat-monitors\``,
			examples: monitorsExamples['livechat/monitors.create'],
			tags: ['Omnichannel Monitors'],
			response: {
				200: POSTLivechatMonitorsCreateSuccessResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissionsRequired: ['manage-livechat-monitors'],
			license: ['livechat-enterprise'],
			body: isPOSTLivechatMonitorCreateRequest,
		},
		async function action() {
			const { username } = this.bodyParams;

			const result = await LivechatEnterprise.addMonitor(username);

			return API.v1.success(result);
		},
	)
	.post(
		'livechat/monitors.delete',
		{
			summary: 'Delete a Monitor',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Enterprise%20tag.svg" alt="Enterprise" style="display: block; margin: auto;"></div>

Delete an Omnichannel monitor. Permission required: \`manage-livechat-monitors\``,
			examples: monitorsExamples['livechat/monitors.delete'],
			tags: ['Omnichannel Monitors'],
			response: {
				200: POSTLivechatMonitorsDeleteSuccessResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissionsRequired: ['manage-livechat-monitors'],
			license: ['livechat-enterprise'],
			body: isPOSTLivechatMonitorsDeleteRequest,
		},
		async function action() {
			const { username } = this.bodyParams;

			try {
				const result = await LivechatEnterprise.removeMonitor(username);
				if (!result) {
					return API.v1.failure('error-removing-monitor');
				}

				return API.v1.success();
			} catch (error: unknown) {
				if (error instanceof Meteor.Error) {
					return API.v1.failure(error.reason);
				}

				return API.v1.failure('error-removing-monitor');
			}
		},
	);

type LivechatMonitorsEndpoints = ExtractRoutesFromAPI<typeof livechatMonitorsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatMonitorsEndpoints {}
}
