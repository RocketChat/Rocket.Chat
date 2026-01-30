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

import { findMonitors, findMonitorByUsername } from './lib/monitors';
import { API } from '../../../../../app/api/server';
import type { ExtractRoutesFromAPI } from '../../../../../app/api/server/ApiClass';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

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
