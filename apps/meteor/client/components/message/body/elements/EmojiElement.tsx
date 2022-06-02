import { MessageEmoji, ThreadMessageEmoji } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../../../lib/utils/renderEmoji';
import { useMessageBodyIsThreadPreview } from '../MessageBodyContext';

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

	// @todo remove it when we will have a better solution for thread preview
	const isThreadPreview = useMessageBodyIsThreadPreview();

	if (!emojiProps) {
		return <>:${handle}:</>;
	}

	if (isThreadPreview) {
		return <ThreadMessageEmoji {...emojiProps}>:{handle}:</ThreadMessageEmoji>;
	}

	return <MessageEmoji {...emojiProps}>:{handle}:</MessageEmoji>;
};

export default EmojiElement;
