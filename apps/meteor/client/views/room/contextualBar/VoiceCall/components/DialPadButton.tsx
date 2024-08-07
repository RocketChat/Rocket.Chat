import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import React from 'react';

import { useLongPress } from '../../../../../../ee/client/voip/modal/DialPad/hooks/useLongPress';

type DialPadButtonProps = {
	digit: string;
	subDigit?: string;
	longPressDigit?: string;
	onClick: (digit: string) => void;
};

const dialPadButtonClass = css`
	width: 52px;
	height: 40px;
	min-width: 52px;
	padding: 4px;

	> .rcx-button--content {
		display: flex;
		flex-direction: column;
	}
`;

const DialPadButton = ({ digit, subDigit, longPressDigit, onClick }: DialPadButtonProps) => {
	const events = useLongPress(() => longPressDigit && onClick(longPressDigit), {
		onClick: () => onClick(digit),
	});

	return (
		<Button className={dialPadButtonClass} {...events}>
			<Box is='span' fontSize={16} lineHeight={16}>
				{digit}
			</Box>
			<Box is='span' fontSize={12} lineHeight={12} mbs={4} color='hint'>
				{subDigit}
			</Box>
		</Button>
	);
};

export default DialPadButton;
