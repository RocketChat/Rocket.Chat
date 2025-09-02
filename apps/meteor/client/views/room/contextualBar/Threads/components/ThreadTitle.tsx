import type { IThreadMainMessage } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useSetting, useUser } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { emojiParser } from '../../../../../../app/emoji/client/emojiParser';
import { filterMarkdown } from '../../../../../../app/markdown/lib/markdown';
import { MentionsParser } from '../../../../../../app/mentions/lib/MentionsParser';
import { ContextualbarTitle } from '../../../../../components/Contextualbar';

type ThreadTitleProps = {
	mainMessage: IThreadMainMessage;
};

const ThreadTitle = ({ mainMessage }: ThreadTitleProps) => {
	const me = useUser()?.username || '';
	const pattern = useSetting('UTF8_User_Names_Validation', '[0-9a-zA-Z-_.]+');
	const useRealName = useSetting('UI_Use_Real_Name', false);

	const html = useMemo((): string => {
		const message = { ...mainMessage };

		if (message.msg) {
			const filteredMessage = filterMarkdown(escapeHTML(message.msg));
			if (!message.channels && !message.mentions) {
				return filteredMessage;
			}

			const instance = new MentionsParser({
				pattern: () => pattern,
				useRealName: () => useRealName,
				me: () => me,
				userTemplate: ({ label }) => `<strong> ${label} </strong>`,
				roomTemplate: ({ prefix, mention }) => `${prefix}<strong> ${mention} </strong>`,
			});
			const html = emojiParser(filteredMessage);
			return instance.parse({ ...message, msg: filteredMessage, html }).html ?? '';
		}

		if (message.attachments) {
			const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

			if (attachment?.description) {
				return escapeHTML(attachment.description);
			}

			if (attachment?.title) {
				return escapeHTML(attachment.title);
			}
		}

		return '';
	}, [mainMessage, me, pattern, useRealName]);

	const innerHTML = useMemo(() => ({ __html: html }), [html]);
	return <ContextualbarTitle dangerouslySetInnerHTML={innerHTML} />;
};

export default ThreadTitle;
