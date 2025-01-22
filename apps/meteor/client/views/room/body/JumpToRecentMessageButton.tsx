import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { isTruthy } from '../../../../lib/isTruthy';

type JumpToRecentMessageButtonProps = {
	visible: boolean;
	onClick: () => void;
	text: string;
};

const buttonStyle = css`
	position: absolute;
	z-index: 2;
	bottom: 8px;
	left: 50%;
	user-select: none;
	transform: translate(-50%, 0);

	&.not {
		visibility: hidden;
	}

	&.clicked {
		animation: fadeout 1s linear forwards;
	}

	@keyframes fadeout {
		50% {
			visibility: visible;
			transform: translate(-50%, 150%);
		}
		100% {
			visibility: hidden;
			transform: translate(-50%, 150%);
			position: fixed;
		}
	}
`;

const JumpToRecentMessageButton = ({ visible, onClick, text }: JumpToRecentMessageButtonProps): ReactElement => {
	const [clicked, setClicked] = useState(false);

	return (
		<Box className={[buttonStyle, !visible && 'not', clicked && 'clicked'].filter(isTruthy)}>
			<Bubble
				icon='arrow-down'
				onClick={() => {
					onClick();
					setClicked(true);
				}}
			>
				{text}
			</Bubble>
		</Box>
	);
};

export default JumpToRecentMessageButton;
