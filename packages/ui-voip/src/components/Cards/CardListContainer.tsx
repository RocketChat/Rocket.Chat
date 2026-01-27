import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CardContainerProps = {
	children: ReactNode;
	shouldWrapCards?: boolean;
	direction?: 'row' | 'column';
	width?: 'fit-content' | number;
	height?: number;
	marginInline?: 'auto' | number;
	justifyContent?: 'center' | 'start';
	overflow?: 'hidden' | 'scroll' | 'auto';
	autoMargin?: boolean;
};

const CardContainer = ({
	children,
	shouldWrapCards,
	direction = 'row',
	width = 'fit-content',
	height,
	marginInline = 'auto',
	overflow,
	autoMargin = false,
}: CardContainerProps) => {
	return (
		<Box
			display='flex'
			mb={autoMargin ? 'auto' : undefined}
			mi={marginInline}
			flexDirection={direction}
			flexWrap={shouldWrapCards ? 'wrap' : 'nowrap'}
			flexGrow={1}
			justifyContent='center'
			alignItems='center'
			p={2}
			width={width}
			height={height}
			overflow={overflow}
		>
			{children}
		</Box>
	);
};

export default CardContainer;
