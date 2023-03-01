import type { IMessage } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import { filterMarkdown } from '../../app/markdown/lib/markdown';
import ParsedText from '../components/message/content/uikit/ParsedText';

export function normalizeThreadMessage({ ...message }: Readonly<Pick<IMessage, 'msg' | 'mentions' | 'attachments'>>): ReactElement | null {
	if (message.msg) {
		message.msg = filterMarkdown(message.msg);
		delete message.mentions;
		return <ParsedText text={message.msg} />;
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment?.description) {
			return <>{attachment.description}</>;
		}

		if (attachment?.title) {
			return <>{attachment.title}</>;
		}
	}

	return null;
}
