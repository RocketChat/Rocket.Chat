import { MessageEmoji } from '@rocket.chat/fuselage';
import { ReactElement, useMemo, useContext } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type BigEmojiElementProps = {
	handle: string;
};

const BigEmojiElement = ({ handle }: BigEmojiElementProps): ReactElement => {
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

	return (
		<MessageEmoji big {...emojiProps}>
			:{handle}:
		</MessageEmoji>
	);
};

export default BigEmojiElement;
