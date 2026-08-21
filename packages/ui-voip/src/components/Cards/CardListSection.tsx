import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type CardListSectionProps = {
	children: ReactNode;
};

export const SECTION_MAX_HEIGHT = 50;

const CardListSection = ({ children }: CardListSectionProps) => {
	return (
		<Box
			display='flex'
			flexGrow={1}
			flexShrink={1}
			overflow='auto'
			justifyContent='stretch'
			alignItems='center'
			padding={2}
			maxHeight='full'
		>
			{children}
		</Box>
	);
};

export default CardListSection;
