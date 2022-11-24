import type { IMessage } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';

import { Messages } from '../../../app/models/client';
import { call } from '../utils/call';
import { ChatAPI } from './ChatAPI';

export const createAllMessages = (): ChatAPI['allMessages'] => {
	const getSingleMessage = (mid: IMessage['_id']): Promise<IMessage> => call('getSingleMessage', mid);

	const findOneByID = async (mid: IMessage['_id']): Promise<IMessage | undefined> =>
		(Messages as Mongo.Collection<IMessage>).findOne({ _id: mid }, { reactive: false }) ?? getSingleMessage(mid);

	const getOneByID = async (mid: IMessage['_id']): Promise<IMessage> => {
		const message = await findOneByID(mid);

		if (!message) {
			throw new Error('Message not found');
		}

		return message;
	};

	return {
		findOneByID,
		getOneByID,
	};
};
