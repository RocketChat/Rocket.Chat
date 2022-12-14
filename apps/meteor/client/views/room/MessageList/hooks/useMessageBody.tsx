import type { IMessage } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

export const useMessageBody = ({ attachments, msg }: Partial<Pick<IMessage, 'msg' | 'attachments'>> = {}): string =>
	useMemo(() => {
		if (msg) {
			return msg;
		}

		if (attachments) {
			const attachment = attachments.find((attachment) => attachment.title || attachment.description);

			if (attachment?.description) {
				return attachment.description;
			}

			if (attachment?.title) {
				return attachment.title;
			}
		}

		return '';
	}, [attachments, msg]);
