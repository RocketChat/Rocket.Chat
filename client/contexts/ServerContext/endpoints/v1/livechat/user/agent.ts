import { ILivechatAgent } from '../../../../../../../definition/ILivechatAgent';
import { ObjectFromApi } from '../../../../../../../definition/ObjectFromApi';

export type LivechatAgents = {
	GET: (params: {
		text: string;
		offset: number;
		count: number;
	}) => {
		tags: ObjectFromApi<ILivechatAgent>[];
		total: number;
	};
};
