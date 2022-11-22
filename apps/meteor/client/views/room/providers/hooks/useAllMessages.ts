import { IMessage } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import { Mongo } from 'meteor/mongo';
import { useMemo } from 'react';

import { Messages } from '../../../../../app/models/client';
import { ChatAPI } from '../../contexts/ChatContext';

export const useAllMessages = (): ChatAPI['allMessages'] => {
	const getSingleMessage = useMethod('getSingleMessage');

	return useMemo(() => {
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
		} as const;
	}, [getSingleMessage]);
};
