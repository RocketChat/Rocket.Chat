import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export const ACTION_STRIP_TOTAL_HEIGHT = 56;

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
			bg='surface-light'
			borderBlock='1px solid'
			borderColor='stroke-extra-light'
			paddingInline={20}
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
