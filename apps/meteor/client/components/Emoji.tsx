import React, { ReactElement, CSSProperties } from 'react';

import { getEmojiClassNameAndDataTitle } from '../lib/utils/renderEmoji';

type EmojiProps = {
	emojiHandle: string; // :emoji:
	style?: CSSProperties;
};

function Emoji({ emojiHandle, style }: EmojiProps): ReactElement {
	const { image: backgroundImage, ...emojiProps } = getEmojiClassNameAndDataTitle(emojiHandle);

	return <span style={{ backgroundImage, ...style }} {...emojiProps} />;
}

export default Emoji;
