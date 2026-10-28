import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type DescriptionListFrameProps = {
	title?: string;
	children: ReactNode;
};

/**
 * Frames a description list: its optional title over the label column, and room below before the next list.
 */
const DescriptionListFrame = ({ title, children }: DescriptionListFrameProps) => (
	<Box paddingBlockEnd='x32'>
		{title && (
			<Box display='flex' justifyContent='flex-end' width='30%' paddingInline='x8'>
				{title}
			</Box>
		)}
		{children}
	</Box>
);

export default DescriptionListFrame;
