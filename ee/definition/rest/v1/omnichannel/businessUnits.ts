import { IOmnichannelBusinessUnit } from '../../../../../definition/IOmnichannelBusinessUnit';
import { ILivechatMonitor } from '../../../../../definition/ILivechatMonitor';

type WithPagination<T> = {
	units: T;
	count: number;
	offset: number;
	total: number;
}

export type OmnichannelBusinessUnitsEndpoints = {
	'livechat/units.list': {
		GET: () => (WithPagination<IOmnichannelBusinessUnit[]>);
	};
	'livechat/units.getOne': {
		GET: () => (IOmnichannelBusinessUnit);
	};
	'livechat/unitMonitors.list': {
		GET: () => ({ monitors: ILivechatMonitor[] });
	};
	'livechat/units': {
		GET: () => (WithPagination<IOmnichannelBusinessUnit[]>);
		POST: () => IOmnichannelBusinessUnit;
	};
	'livechat/units/:id': {
		GET: () => IOmnichannelBusinessUnit;
		POST: () => IOmnichannelBusinessUnit;
		DELETE: () => number;
	};
}
