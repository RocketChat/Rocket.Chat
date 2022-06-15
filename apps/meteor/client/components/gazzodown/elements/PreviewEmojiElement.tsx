import { ThreadMessageEmoji } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../../lib/utils/renderEmoji';

type PreviewEmojiElementProps = {
	handle: string;
};

const PreviewEmojiElement = ({ handle }: PreviewEmojiElementProps): ReactElement => {
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

	return <ThreadMessageEmoji {...emojiProps}>:{handle}:</ThreadMessageEmoji>;
};

export default PreviewEmojiElement;
