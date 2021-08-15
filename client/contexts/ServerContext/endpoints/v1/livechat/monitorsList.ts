import { ILivechatMonitor } from '../../../../../../definition/ILivechatMonitor';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type LivechatMonitorsList = {
	GET: (params: { text: string; offset: number; count: number }) => {
		monitors: ObjectFromApi<ILivechatMonitor>[];
		total: number;
	};
};
