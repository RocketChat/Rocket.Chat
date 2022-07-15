import { Box, Button } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import type { PadDigit } from './Pad';
import { useLongPress } from './hooks/useLongPress';

const letters = ['+', '', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];

const PadButton = ({
	children,
	onClickPadButton,
	onLongPressPadButton,
}: {
	children: PadDigit;
	onClickPadButton: (digit: PadDigit) => void;
	onLongPressPadButton: (digit: PadDigit) => void;
}): ReactElement => {
	const { onClick, onMouseDown, onMouseUp, onTouchStart, onTouchEnd } = useLongPress(() => onLongPressPadButton(children), {
		onClick: () => onClickPadButton(children),
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
			<Box fontSize='h2'>{children}</Box>
			<Box fontSize='c1' color='info'>
				{typeof children === 'number' && letters[children]}
			</Box>
		</Button>
	);
};

export default PadButton;
