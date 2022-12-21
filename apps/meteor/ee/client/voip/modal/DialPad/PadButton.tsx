import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import type { ReactElement } from 'react';
import React from 'react';

import type { PadDigit } from './Pad';
import { useLongPress } from './hooks/useLongPress';

const padButtonStyle = css`
	background-color: transparent;
	width: 94px;
	height: 64px;
	padding: 8px;
	margin: 8px;
	border: none;
	display: flex;
	flex-direction: column;
	align-items: center;

	&:hover {
		background-color: ${colors.n400};
	}
`;

const PadButton = ({
	children,
	onClickPadButton,
	onLongPressPadButton,
}: {
	children: PadDigit;
	onClickPadButton: (digit: PadDigit[0]) => void;
	onLongPressPadButton: (digit: PadDigit[1]) => void;
}): ReactElement => {
	const [firstDigit, secondDigit] = children;
	const { onClick, onMouseDown, onMouseUp, onTouchStart, onTouchEnd } = useLongPress(() => onLongPressPadButton(secondDigit), {
		onClick: () => onClickPadButton(firstDigit),
	});

	return (
		<Button
			className={padButtonStyle}
			onClick={onClick}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
		>
			<Box is='span' fontSize='h2' lineHeight='32px'>
				{firstDigit}
			</Box>
			<Box is='span' fontSize='c1' lineHeight='16px' color='hint'>
				{secondDigit}
			</Box>
		</Button>
	);
};

export default PadButton;
