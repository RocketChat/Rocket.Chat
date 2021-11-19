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
		GET: (params: {
			text: string;
		}) => (WithPagination<IOmnichannelBusinessUnit[]>);
	};
	'livechat/units.getOne': {
		GET: (params: {
			unitId: string;
		}) => (IOmnichannelBusinessUnit);
	};
	'livechat/unitMonitors.list': {
		GET: (params: {
			unitId: string;
		}) => ({ monitors: ILivechatMonitor[] });
	};
	'livechat/units': {
		GET: (params: {
			text: string;
		}) => (WithPagination<IOmnichannelBusinessUnit[]>);
		POST: (params: {
			unitData: unknown; // TODO
			unitMonitors: unknown; // TODO
			unitDepartments: unknown; // TODO
		}) => IOmnichannelBusinessUnit;
	};
	'livechat/units/:id': {
		GET: () => IOmnichannelBusinessUnit;
		POST: (params: {
			unitData: unknown; // TODO
			unitMonitors: unknown; // TODO
			unitDepartments: unknown; // TODO
		}) => IOmnichannelBusinessUnit;
		DELETE: () => number;
	};
}
