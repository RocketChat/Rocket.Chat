import React, { ReactElement } from 'react';

import { getEmojiClassNameAndDataTitle } from '../lib/utils/renderEmoji';

type EmojiProps = {
	emojiHandle: string; // :emoji:
	className?: string;
};

function Emoji({ emojiHandle, className }: EmojiProps): ReactElement {
	const { image: backgroundImage, className: emojiClassName, ...emojiProps } = getEmojiClassNameAndDataTitle(emojiHandle);

	return (
		<span style={{ backgroundImage }} className={`${emojiClassName} ${className || ''}`} {...emojiProps}>
			{!backgroundImage ? emojiHandle : ''}
		</span>
	);
}

export default Emoji;
