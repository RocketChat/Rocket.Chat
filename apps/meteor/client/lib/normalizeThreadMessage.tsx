import type { IMessage } from '@rocket.chat/core-typings';
import { Markup } from '@rocket.chat/gazzodown';
import { parse } from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import { filterMarkdown } from '../../app/markdown/lib/markdown';
import GazzodownText from '../components/GazzodownText';

export function normalizeThreadMessage({ ...message }: Readonly<Pick<IMessage, 'msg' | 'mentions' | 'attachments'>>): ReactElement | null {
	if (message.msg) {
		message.msg = filterMarkdown(message.msg);
		delete message.mentions;

		const tokens = message.msg ? parse(message.msg, { emoticons: true }) : undefined;

		if (!tokens) {
			return null;
		}

		return (
			<GazzodownText>
				<Markup tokens={tokens} />
			</GazzodownText>
		);
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
