import { IMessage } from '../../../../../../definition/IMessage';

export type UnfollowMessageEndpoint = {
	POST: (params: { mid: IMessage['_id'] }) => {
		success: true;
		statusCode: 200;
		body: {};
	};
};
