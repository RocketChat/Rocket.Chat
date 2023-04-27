import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import type { ReactElement, UIEvent } from 'react';
import React from 'react';

import { isTruthy } from '../../../../../lib/isTruthy';

type JumpToRecentMessageButtonProps = {
	visible: boolean;
	onClick: (event: UIEvent) => void;
	text: string;
};

const buttonStyle = css`
	position: absolute;
	z-index: 2;
	bottom: 8px;
	left: 50%;

	cursor: pointer;
	user-select: none;
	transform: translate(-50%, 0);

	text-align: center;

	border-radius: 20px;

	&.not {
		animation: fadeout 1s linear forwards;
	}

	background-color: ${Palette.status['status-background-info']};

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
	return (
		<Box
			is='button'
			fontScale='c2'
			minWidth='x130'
			h='x30'
			pi='x16'
			className={[buttonStyle, !visible && 'not'].filter(isTruthy)}
			onClick={onClick}
		>
			{text}
			<Icon name='arrow-down' size='x16' />
		</Box>
	);
};

export default JumpToRecentMessageButton;
