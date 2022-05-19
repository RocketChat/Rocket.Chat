import { ThreadMessageEmoji as EmojiBase } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../../../lib/utils/renderEmoji';

type ThreadMessageEmojiProps = {
	emojiHandle: string; // :emoji:
};

function ThreadMessageEmoji({ emojiHandle }: ThreadMessageEmojiProps): ReactElement {
	const emojiProps = getEmojiClassNameAndDataTitle(emojiHandle);

	if (!emojiProps.className && !emojiProps.name) {
		return <>{emojiHandle}</>;
	}

	return <EmojiBase {...emojiProps}>{emojiHandle}</EmojiBase>;
}

export default ThreadMessageEmoji;
