import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const ACTION_STRIP_HEIGHT = 32;
const ACTION_STRIP_MARGIN = 8;

export const ACTION_STRIP_TOTAL_HEIGHT = ACTION_STRIP_HEIGHT + ACTION_STRIP_MARGIN * 2;

type ActionStripProps = {
	children: ReactNode;
	leftSlot?: ReactNode;
	rightSlot?: ReactNode;
};

// TODO: fix alignment: timer shoves the button a little to the right
const ActionStrip = ({ children, leftSlot, rightSlot }: ActionStripProps) => {
	return (
		<Box
			display='flex'
			flexDirection='row'
			justifyContent='space-between'
			flexShrink={0}
			w='full'
			alignItems='center'
			height={ACTION_STRIP_TOTAL_HEIGHT}
		>
			{leftSlot}
			<ButtonGroup large align='center' style={{ flexGrow: 2, justifySelf: 'center' }}>
				{children}
			</ButtonGroup>
			{rightSlot}
		</Box>
	);
};

export default ActionStrip;
