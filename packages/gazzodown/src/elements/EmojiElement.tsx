import { MessageEmoji } from '@rocket.chat/fuselage';
import { ReactElement, useMemo, useContext } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type EmojiElementProps = {
	handle: string;
};

const EmojiElement = ({ handle }: EmojiElementProps): ReactElement => {
	const { getEmojiClassNameAndDataTitle } = useContext(MarkupInteractionContext);

	const emojiProps = useMemo(() => {
		const props = getEmojiClassNameAndDataTitle?.(`:${handle}:`) ?? { className: undefined, name: undefined };

		if (!props.className && !props.name) {
			return undefined;
		}

		return props;
	}, [getEmojiClassNameAndDataTitle, handle]);

	if (!emojiProps) {
		return <>:{handle}:</>;
	}

	return <MessageEmoji {...emojiProps}>:{handle}:</MessageEmoji>;
};

export default EmojiElement;
