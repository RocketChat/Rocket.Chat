import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import PadButton from './PadButton';

export type PadDigit = [string, string];

const digits: PadDigit[] = [
	['1', ''],
	['2', 'ABC'],
	['3', 'DEF'],
	['4', 'GHI'],
	['5', 'JKL'],
	['6', 'MNO'],
	['7', 'PQRS'],
	['8', 'TUV'],
	['9', 'WXYZ'],
	['*', ''],
	['0', '+'],
	['#', ''],
];

const Pad = ({
	onClickPadButton,
	onLongPressPadButton,
}: {
	onClickPadButton: (digit: PadDigit[0]) => void;
	onLongPressPadButton: (digit: PadDigit[1]) => void;
}): ReactElement => (
	<Box display='flex' flexWrap='wrap' justifyContent='center' mi='-8px' mbs='24px'>
		{digits.map((digit, idx) => (
			<PadButton key={idx} onClickPadButton={onClickPadButton} onLongPressPadButton={onLongPressPadButton}>
				{digit}
			</PadButton>
		))}
	</Box>
);

export default Pad;
