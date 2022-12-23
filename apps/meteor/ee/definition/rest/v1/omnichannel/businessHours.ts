import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/livechat/business-hours': {
			GET: (params: { name?: string; offset: number; count: number; sort: Record<string, unknown> }) => {
				businessHours: ILivechatBusinessHour[];
				count: number;
				offset: number;
				total: number;
			};
		};
	}
}
