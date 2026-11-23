import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type PreviewFrameProps = { children: ReactNode };

const PreviewFrame = ({ children }: PreviewFrameProps) => (
	<Box
		position='relative'
		overflow='hidden'
		borderRadius='medium'
		display='flex'
		alignItems='center'
		justifyContent='center'
		style={{ aspectRatio: '16 / 9', backgroundColor: 'black' }}
	>
		{children}
	</Box>
);

export default PreviewFrame;
