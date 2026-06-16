import type { IMessage } from '@rocket.chat/core-typings';
import { Markup } from '@rocket.chat/gazzodown';
import { parse } from '@rocket.chat/message-parser';
import type { Root } from '@rocket.chat/message-parser';

import { getMarkdownParserLimit } from './getMarkdownParserLimit';
import { filterMarkdown } from '../../app/markdown/lib/markdown';
import GazzodownText from '../components/GazzodownText';

const tryParseWithLimit = (text: string): Root | undefined => {
	if (text.length > getMarkdownParserLimit()) {
		return [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: text }] }] as Root;
	}

	const filtered = filterMarkdown(text);

	try {
		return parse(filtered, { emoticons: true });
	} catch {
		return undefined;
	}
};

export function normalizeThreadMessage({ ...message }: Readonly<Pick<IMessage, 'msg' | 'mentions' | 'attachments'>>) {
	if (message.msg) {
		delete message.mentions;

		const tokens = tryParseWithLimit(message.msg);

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
