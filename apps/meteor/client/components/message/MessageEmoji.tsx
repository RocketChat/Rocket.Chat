import { MessageEmoji as MessageEmojiBase, ThreadMessageEmoji } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../lib/utils/renderEmoji';

type MessageEmojiProps = {
	emojiHandle: string; // :emoji:
	big?: boolean;
	isThreadPreview?: boolean;
};

function MessageEmoji({ emojiHandle, big, isThreadPreview }: MessageEmojiProps): ReactElement {
	const emojiProps = getEmojiClassNameAndDataTitle(emojiHandle);

	if (!emojiProps.className && !emojiProps.name) {
		return <>{emojiHandle}</>;
	}

	if (isThreadPreview) {
		return <ThreadMessageEmoji {...emojiProps}>{emojiHandle}</ThreadMessageEmoji>;
	}

	return (
		<MessageEmojiBase big={big} {...emojiProps}>
			{emojiHandle}
		</MessageEmojiBase>
	);
}

export default MessageEmoji;
