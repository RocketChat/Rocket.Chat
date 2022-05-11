import { IMessage } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

export const useParentMessageTransform = (message?: IMessage): IMessage | undefined =>
	useMemo(() => {
		if (message?.attachments) {
			const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

			if (attachment?.description) {
				return {
					...message,
					msg: attachment.description,
				};
			}

			if (attachment?.title) {
				return {
					...message,
					msg: attachment.title,
				};
			}
		}

		return message;
	}, [message]);
