import { IMessage } from '../../../../../../definition/IMessage';

export type GetMessageEndpoint = {
	GET: (params: { msgId: IMessage['_id'] }) => {
		message: IMessage;
	};
};
