import { MessageEmoji } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../../lib/utils/renderEmoji';

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

	if (!emojiProps) {
		return <>:${handle}:</>;
	}

	return (
		<MessageEmoji big {...emojiProps}>
			:{handle}:
		</MessageEmoji>
	);
};

export default BigEmojiElement;
