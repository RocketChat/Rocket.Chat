import { useMemo } from 'react';

import { IMessage } from '../../../../../definition/IMessage';

export const useMessageBody = ({
	attachments,
	msg,
}: Partial<Pick<IMessage, 'msg' | 'attachments'>> = {}): string =>
	useMemo(() => {
		if (msg) {
			return msg;
		}

		if (attachments) {
			const attachment = attachments.find(
				(attachment) => attachment.title || attachment.description,
			);

			if (attachment && attachment.description) {
				return attachment.description;
			}

			if (attachment && attachment.title) {
				return attachment.title;
			}
		}

		return '';
	}, [attachments, msg]);
