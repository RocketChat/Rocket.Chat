import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import {
	isGETBusinessHourParams,
	isPOSTLivechatBusinessHoursSaveParams,
	isPOSTLivechatBusinessHoursRemoveParams,
	POSTLivechatBusinessHoursRemoveSuccessResponse,
	POSTLivechatBusinessHoursSaveSuccessResponse,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import type { ExtractRoutesFromAPI } from '../../../../api/server/ApiClass';
import { findLivechatBusinessHour } from '../../../server/api/lib/businessHours';
import { businessHourManager } from '../../../server/business-hour';

API.v1.addRoute(
	'livechat/business-hour',
	{ authRequired: true, permissionsRequired: ['view-livechat-business-hours'], validateParams: isGETBusinessHourParams },
	{
		async get() {
			const { _id, type } = this.queryParams;
			const { businessHour } = await findLivechatBusinessHour(_id, type);
			return API.v1.success({
				businessHour,
			});
		},
	},
);

const livechatBusinessHoursEndpoints = API.v1
	.post(
		'livechat/business-hours.save',
		{
			response: {
				200: POSTLivechatBusinessHoursSaveSuccessResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
			authRequired: true,
			body: isPOSTLivechatBusinessHoursSaveParams,
		},
		async function action() {
			const params = this.bodyParams;

			// TODO: Remove typecasting after refactoring saveBusinessHour logic with proper type logic. See: CORE-1552
			const result = await businessHourManager.saveBusinessHour(params as unknown as ILivechatBusinessHour);

			return API.v1.success(result);
		}
	)
	.post(
		'livechat/business-hours.remove',
		{
			response: {
				200: POSTLivechatBusinessHoursRemoveSuccessResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
			authRequired: true,
			body: isPOSTLivechatBusinessHoursRemoveParams,
		},
		async function action() {
			const { _id, type } = this.bodyParams;

			await businessHourManager.removeBusinessHourByIdAndType(_id, type);

			return API.v1.success();
		}
	);

type LivechatBusinessHoursEndpoints = ExtractRoutesFromAPI<typeof livechatBusinessHoursEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatBusinessHoursEndpoints {}
}
