import type { ILivechatMonitor, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Endpoints {
		'livechat/units.list': {
			GET: (params: { text: string }) => PaginatedResult & {
				units: IOmnichannelBusinessUnit[];
			};
		};
		'livechat/units.getOne': {
			GET: (params: { unitId: string }) => IOmnichannelBusinessUnit;
		};
		'livechat/unitMonitors.list': {
			GET: (params: { unitId: string }) => { monitors: ILivechatMonitor[] };
		};
		'livechat/units': {
			GET: (params: { text: string }) => PaginatedResult & { units: IOmnichannelBusinessUnit[] };
			POST: (params: { unitData: string; unitMonitors: string; unitDepartments: string }) => IOmnichannelBusinessUnit;
		};
		'livechat/units/:id': {
			GET: () => IOmnichannelBusinessUnit;
			POST: (params: { unitData: string; unitMonitors: string; unitDepartments: string }) => IOmnichannelBusinessUnit;
			DELETE: () => number;
		};
	}
}
