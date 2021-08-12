import { IMessage } from '../../../../../../definition/IMessage/IMessage';
import { IRoom } from '../../../../../../definition/IRoom';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type FilesEndpoint = {
	GET: (params: {
		roomId: IRoom['_id'];
		offset: number;
		count: number;
		sort: string;
		query: string;
	}) => {
		files: ObjectFromApi<IMessage>[];
		total: number;
	};
};
