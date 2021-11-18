import { ILivechatBusinessUnit } from '../../../../../definition/ILivechatBusinessUnit';
import { ILivechatMonitor } from '../../../../../definition/ILivechatMonitor';

type WithPagination<T> = {
	units: T;
	count: number;
	offset: number;
	total: number;
}

export type OmnichannelBusinessUnitsEndpoints = {
	'livechat/units.list': {
		GET: () => (WithPagination<ILivechatBusinessUnit[]>);
	};
	'livechat/units.getOne': {
		GET: () => (ILivechatBusinessUnit);
	};
	'livechat/unitMonitors.list': {
		GET: () => ({ monitors: ILivechatMonitor[] });
	};
	'livechat/units': {
		GET: () => (WithPagination<ILivechatBusinessUnit[]>);
		POST: () => ILivechatBusinessUnit;
	};
	'livechat/units/:id': {
		GET: () => ILivechatBusinessUnit;
		POST: () => ILivechatBusinessUnit;
		DELETE: () => number;
	};
}
