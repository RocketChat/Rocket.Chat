import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement } from 'react';

import { renderEmoji } from '../lib/utils/renderEmoji';

type EmojiProps = {
	emojiHandle: string; // :emoji:
	className?: ComponentProps<typeof Box>['className'];
};

function Emoji({ emojiHandle, className = undefined }: EmojiProps): ReactElement {
	const markup = { __html: `${renderEmoji(emojiHandle) || emojiHandle}` };
	return <Box is='span' className={className} dangerouslySetInnerHTML={markup} />;
}

export default Emoji;
