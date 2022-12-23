import type { ILivechatMonitor, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/livechat/units.list': {
			GET: (params: { text: string }) => PaginatedResult & {
				units: IOmnichannelBusinessUnit[];
			};
		};
		'/v1/livechat/units/:unitId/monitors': {
			GET: (params: { unitId: string }) => { monitors: ILivechatMonitor[] };
		};
		'/v1/livechat/units': {
			GET: (params: { text: string }) => PaginatedResult & { units: IOmnichannelBusinessUnit[] };
			POST: (params: { unitData: string; unitMonitors: string; unitDepartments: string }) => IOmnichannelBusinessUnit;
		};
		'/v1/livechat/units/:id': {
			GET: () => IOmnichannelBusinessUnit | null;
			POST: (params: { unitData: string; unitMonitors: string; unitDepartments: string }) => IOmnichannelBusinessUnit;
			DELETE: () => number;
		};
	}
}
