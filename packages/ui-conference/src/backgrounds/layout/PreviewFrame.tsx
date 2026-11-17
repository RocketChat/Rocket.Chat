import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const PreviewFrame = ({ children }: { children: ReactNode }) => (
	<Box
		position='relative'
		overflow='hidden'
		borderRadius='medium'
		marginBlockEnd={16}
		display='flex'
		alignItems='center'
		justifyContent='center'
		style={{ aspectRatio: '16 / 9', backgroundColor: 'black' }}
	>
		{children}
	</Box>
);

export default PreviewFrame;
