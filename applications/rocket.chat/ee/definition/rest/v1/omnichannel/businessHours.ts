import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';

export type OmnichannelBusinessHoursEndpoints = {
	'livechat/business-hours.list': {
		GET: (params: { name?: string; offset: number; count: number; sort: Record<string, unknown> }) => {
			businessHours: ILivechatBusinessHour[];
			count: number;
			offset: number;
			total: number;
		};
	};
};
