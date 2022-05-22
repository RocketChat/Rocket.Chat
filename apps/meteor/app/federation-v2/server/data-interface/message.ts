import { IMessage, IUser } from '@rocket.chat/core-typings';

import { dataInterface } from '.';

interface INormalizedMessage extends IMessage {
	u: Required<Pick<IUser, '_id' | 'username' | 'name'>>;
}

export const normalize = async (message: IMessage): Promise<INormalizedMessage> => {
	// TODO: normalize the entire payload (if needed)
	const normalizedMessage: INormalizedMessage = message as INormalizedMessage;

	// Normalize the user
	normalizedMessage.u = (await dataInterface.user(message.u._id)) as Required<Pick<IUser, '_id' | 'username' | 'name'>>;

	return normalizedMessage;
};
