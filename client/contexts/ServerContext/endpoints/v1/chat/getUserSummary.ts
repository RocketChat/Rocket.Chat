import { IRoom } from '../../../../../../definition/IRoom';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';
import { IMessage } from '../../../../../../definition/IMessage';

export type GetUserSummaryEndpoint = {
	GET: (params: {
		rid: IRoom['_id'];
		text?: string;
		offset: number;
		count: number;
	}) => {
		msg: ObjectFromApi<IMessage>[];
		total: number;
	};
};
