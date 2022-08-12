import { Box, Button } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import type { PadDigit } from './Pad';
import { useLongPress } from './hooks/useLongPress';

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
			m='8px'
			pb='8px'
			minWidth='28%'
			display='flex'
			flexDirection='column'
			alignItems='center'
			onClick={onClick}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
		>
			<Box fontSize='h2'>{firstDigit}</Box>
			<Box fontSize='c1' color='info'>
				{secondDigit}
			</Box>
		</Button>
	);
};

export default PadButton;
