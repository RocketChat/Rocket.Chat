import { IMessage } from '../../../../../../definition/IMessage';
import { IRoom } from '../../../../../../definition/IRoom';

export type GetMessageEndpoint = {
	GET: (params: { msgId: IMessage['_id']; taskRoomId?: IRoom['taskRoomId'] }) => {
		message: IMessage;
	};
};
