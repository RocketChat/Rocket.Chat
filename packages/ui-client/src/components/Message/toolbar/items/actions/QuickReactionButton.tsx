import { css } from '@rocket.chat/css-in-js';
import { IconButton, useStyle } from '@rocket.chat/fuselage';

import { useMessageRenderers } from '../../../contexts/MessageRenderersContext';

export type QuickReactionButtonProps = {
	/** The emoji name, without colons. */
	emoji: string;
	onClick: () => void;
};

const smallEmojiClass = css`
	.emoji {
		font-size: 1.125rem;
	}
`;

const QuickReactionButton = ({ emoji, onClick }: QuickReactionButtonProps) => {
	const { Emoji } = useMessageRenderers();
	const className = useStyle(smallEmojiClass);

	return (
		<IconButton
			className={className}
			size='small'
			title={emoji}
			aria-label={emoji}
			data-emoji={emoji}
			icon={<Emoji emojiHandle={`:${emoji}:`} />}
			onClick={onClick}
		/>
	);
};

export default QuickReactionButton;
