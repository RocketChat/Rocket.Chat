import { MessageEmoji as MessageEmojiBase, ThreadMessageEmoji } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../lib/utils/renderEmoji';

type MessageEmojiProps = {
	handle: string;
	big?: boolean;
	isThreadPreview?: boolean;
};

function MessageEmoji({ handle, big, isThreadPreview }: MessageEmojiProps): ReactElement {
	handle = `:${handle}:`;
	const emojiProps = getEmojiClassNameAndDataTitle(handle);

	if (!emojiProps.className && !emojiProps.name) {
		return <>{handle}</>;
	}

	if (isThreadPreview) {
		return <ThreadMessageEmoji {...emojiProps}>{handle}</ThreadMessageEmoji>;
	}

	return (
		<MessageEmojiBase big={big} {...emojiProps}>
			{handle}
		</MessageEmojiBase>
	);
}

export default MessageEmoji;
