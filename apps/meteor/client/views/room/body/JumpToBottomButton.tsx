import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import { isTruthy } from '../../../../lib/isTruthy';

type JumpToBottomButtonProps = {
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

const JumpToBottomButton = ({ visible, onClick, text }: JumpToBottomButtonProps): ReactElement => {

	return (
		<Box className={[buttonStyle, !visible && 'not'].filter(isTruthy)}>
			<Bubble
				icon='arrow-down'
				onClick={() => {
					onClick();
				}}
			>
				{text}
			</Bubble>
		</Box>
	);
};

export default JumpToBottomButton;
