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
	<Box display='flex' style={{ height }}>
		<Box alignSelf='stretch' flexGrow={1} flexShrink={0} position='relative'>
			<Box position='absolute' width='full' height='full'>
				{children}
			</Box>
		</Box>
	</Box>
);

export default ChartFrame;
