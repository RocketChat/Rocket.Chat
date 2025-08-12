import styled from '@rocket.chat/styled';
import type { ReactElement } from 'react';

import { getEmojiClassNameAndDataTitle } from '../lib/utils/renderEmoji';

type EmojiProps = {
	emojiHandle: string; // :emoji:
	className?: string;
	fillContainer?: boolean;
};

const EmojiComponent = styled('span', ({ fillContainer: _fillContainer, ...props }: { fillContainer?: boolean }) => props)`
	${({ fillContainer }) =>
		fillContainer
			? `
				display: inline-block;
				width: 100%;
				height: 100%;
				margin: 0;`
			: ''}
`;

function Emoji({ emojiHandle, className = undefined, fillContainer }: EmojiProps): ReactElement {
	const { className: emojiClassName, image, ...props } = getEmojiClassNameAndDataTitle(emojiHandle);

	return (
		<EmojiComponent
			className={[emojiClassName, className].filter(Boolean).join(' ')}
			style={image?.length ? { backgroundImage: image } : undefined}
			fillContainer={fillContainer}
			{...props}
		/>
	);
}

export default Emoji;
