import { ThreadMessageEmoji } from '@rocket.chat/fuselage';
import { ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type PreviewEmojiElementProps = {
	handle: string;
};

const PreviewEmojiElement = ({ handle }: PreviewEmojiElementProps): ReactElement => {
	const { getEmojiClassNameAndDataTitle } = useContext(MarkupInteractionContext);
	const emojiProps = useMemo(() => {
		const props = getEmojiClassNameAndDataTitle?.(`:${handle}:`) ?? { className: undefined, name: undefined };

		if (!props.className && !props.name) {
			return undefined;
		}

		return props;
	}, [getEmojiClassNameAndDataTitle, handle]);

	if (!emojiProps) {
		return <>:${handle}:</>;
	}

	return <ThreadMessageEmoji {...emojiProps}>:{handle}:</ThreadMessageEmoji>;
};

export default PreviewEmojiElement;
