import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import PadButton from './PadButton';

export type PadDigit = [string, string];

const digits: PadDigit[] = [
	['1', '1'],
	['2', '2'],
	['3', '3'],
	['4', '4'],
	['5', '5'],
	['6', '6'],
	['7', '7'],
	['8', '8'],
	['9', '9'],
	['*', '*'],
	['0', '+'],
	['#', '#'],
];

const Pad = ({
	onClickPadButton,
	onLongPressPadButton,
}: {
	onClickPadButton: (digit: PadDigit) => void;
	onLongPressPadButton: (digit: PadDigit) => void;
}): ReactElement => (
	<Box display='flex' flexWrap='wrap' mi='-8px' mbs='28px'>
		{digits.map((digit, idx) => (
			<PadButton key={idx} onClickPadButton={onClickPadButton} onLongPressPadButton={onLongPressPadButton}>
				{digit}
			</PadButton>
		))}
	</Box>
);

export default Pad;
