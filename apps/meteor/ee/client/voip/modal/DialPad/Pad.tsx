import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import PadButton from './PadButton';

const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'];

const Pad = ({
	onClickPadButton,
	onLongPressPadButton,
}: {
	onClickPadButton: (digit: string | number) => void;
	onLongPressPadButton: (digit: string | number) => void;
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
