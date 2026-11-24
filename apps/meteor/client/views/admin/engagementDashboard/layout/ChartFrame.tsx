import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type ChartFrameProps = {
	/** In pixels, as the chart draws itself in pixels. */
	height: number;
	children: ReactNode;
};

/**
 * Gives a responsive chart a fixed height and the full width it measures itself against.
 */
const ChartFrame = ({ height, children }: ChartFrameProps) => (
	<Box position='relative' style={{ height }}>
		<Box position='absolute' width='full' height='full'>
			{children}
		</Box>
	</Box>
);

export default ChartFrame;
