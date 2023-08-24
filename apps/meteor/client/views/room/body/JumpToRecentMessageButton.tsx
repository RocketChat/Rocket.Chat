import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement, UIEvent } from 'react';
import React, { useState } from 'react';

import { isTruthy } from '../../../../lib/isTruthy';

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
	user-select: none;
	transform: translate(-50%, 0);
	text-align: center;
	border-radius: 20px;
	cursor: pointer;

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
		<Box
			is='button'
			fontScale='c2'
			minWidth='x130'
			bg='status-background-info'
			h='x30'
			pi={16}
			className={[buttonStyle, !visible && 'not', clicked && 'clicked'].filter(isTruthy)}
			onClick={(e) => {
				onClick(e);
				setClicked(true);
			}}
		>
			{text}
			<Icon name='arrow-down' size='x16' />
		</Box>
	);
};

export default JumpToRecentMessageButton;
