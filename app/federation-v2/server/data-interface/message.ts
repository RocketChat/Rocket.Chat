import { IMessage } from '../../../../definition/IMessage';
import { IUser } from '../../../../definition/IUser';
import { dataInterface } from '.';

interface INormalizedMessage extends IMessage {
	u: IUser;
}

export const normalize = async (message: IMessage): Promise<INormalizedMessage> => {
	// TODO: normalize the entire payload (if needed)
	const normalizedMessage: INormalizedMessage = message as INormalizedMessage;

	// Normalize the user
	normalizedMessage.u = await dataInterface.user(message.u._id);

	return normalizedMessage;
};
