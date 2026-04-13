import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export const ACTION_STRIP_TOTAL_HEIGHT = 52;

type ActionStripProps = {
	children: ReactNode;
	leftSlot?: ReactNode;
	rightSlot?: ReactNode;
};

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
			<Box is='span' display='flex' justifyContent='start' alignItems='center' flexGrow={0} flexBasis='20%'>
				{leftSlot}
			</Box>
			<Box is='span' display='flex' justifyContent='center' alignItems='center' flexGrow={1} flexBasis='60%'>
				<ButtonGroup large>{children}</ButtonGroup>
			</Box>
			<Box is='span' display='flex' justifyContent='end' alignItems='center' flexGrow={0} flexBasis='20%'>
				{rightSlot}
			</Box>
		</Box>
	);
};

export default ActionStrip;
