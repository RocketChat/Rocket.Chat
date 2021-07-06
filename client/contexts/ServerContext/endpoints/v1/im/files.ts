import { IMessage } from '../../../../../../definition/IMessage';
import { IRoom } from '../../../../../../definition/IRoom';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type FilesEndpoint = {
	GET: (params: { roomId: IRoom['_id']; count: number; sort: string; query: string }) => {
		files: ObjectFromApi<IMessage>[];
		total: number;
	};
};
