import { IMessage } from '../../../../../../definition/IMessage';
import { IRoom } from '../../../../../../definition/IRoom';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type GetDiscussionsEndpoint = {
	GET: (params: { roomId: IRoom['_id']; text?: string; offset: number; count: number }) => {
		messages: ObjectFromApi<IMessage>[];
		total: number;
	};
};
