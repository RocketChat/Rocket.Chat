import { ILivechatTag } from '../../../../../../definition/ILivechatTag';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type LivechatTagsList = {
	GET: (params: { text: string; offset: number; count: number }) => {
		tags: ObjectFromApi<ILivechatTag>[];
		total: number;
	};
};
