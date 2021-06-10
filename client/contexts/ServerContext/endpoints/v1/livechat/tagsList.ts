import { ILivechatTag } from '../../../../../../definition/ILivechatTag';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type LivechatTagsList = {
	GET: (params: {
		text: string;
		offset: number;
		count: number;
	}) => {
		monitors: ObjectFromApi<ILivechatTag>[];
		total: number;
	};
};
