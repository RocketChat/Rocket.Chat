import { MessageEmoji, ThreadMessageEmoji } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../../../lib/utils/renderEmoji';
import { useMessageBodyIsThreadPreview } from '../MessageBodyContext';

type BigEmojiElementProps = {
	handle: string;
};

const BigEmojiElement = ({ handle }: BigEmojiElementProps): ReactElement => {
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

	return (
		<MessageEmoji big {...emojiProps}>
			:{handle}:
		</MessageEmoji>
	);
};

export default BigEmojiElement;
