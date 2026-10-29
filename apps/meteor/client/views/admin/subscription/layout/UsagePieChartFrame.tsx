import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type UsagePieChartFrameProps = {
	size: number;
	children: ReactNode;
	center: ReactNode;
};

/**
 * A square of `size` pixels holding a pie chart, with `center` laid over the middle of the ring.
 */
const UsagePieChartFrame = ({ size, children, center }: UsagePieChartFrameProps) => (
	<Box size={`x${size}`}>
		<Box position='relative'>
			{children}
			<Box display='flex' alignItems='center' justifyContent='center' position='absolute' style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
				{center}
			</Box>
		</Box>
	</Box>
);

export default UsagePieChartFrame;
