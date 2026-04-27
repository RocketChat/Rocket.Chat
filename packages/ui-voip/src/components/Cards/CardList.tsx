import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type CardListProps = {
	children: ReactNode;
	shouldWrapCards?: boolean;
	direction?: 'row' | 'column';
	height?: number;
	marginInline?: 'auto' | number;
	overflow?: 'hidden' | 'scroll' | 'auto';
	autoMargin?: boolean;
};

const CardList = ({
	children,
	shouldWrapCards,
	direction = 'row',
	height,
	marginInline = 'auto',
	overflow,
	autoMargin = false,
}: CardListProps) => {
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
			height={height}
			overflow={overflow}
		>
			{children}
		</Box>
	);
};

export default CardList;
