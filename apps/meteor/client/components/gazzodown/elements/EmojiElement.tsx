import { MessageEmoji } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../../lib/utils/renderEmoji';

type EmojiElementProps = {
	handle: string;
};

const EmojiElement = ({ handle }: EmojiElementProps): ReactElement => {
	const emojiProps = useMemo(() => {
		const props = getEmojiClassNameAndDataTitle(`:${handle}:`);

		if (!props.className && !props.name) {
			return undefined;
		}

		return props;
	}, [handle]);

	if (!emojiProps) {
		return <>:${handle}:</>;
	}

	return <MessageEmoji {...emojiProps}>:{handle}:</MessageEmoji>;
};

export default EmojiElement;
