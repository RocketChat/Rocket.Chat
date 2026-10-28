import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type ChartDateNavigationProps = {
	previous: ReactNode;
	next: ReactNode;
	/** The share of the row the date takes. */
	dateWidth: '25%' | '50%';
	children: ReactNode;
};

/**
 * The date a chart shows, centred between the controls that step to the previous and next date.
 */
const ChartDateNavigation = ({ previous, next, dateWidth, children }: ChartDateNavigationProps) => (
	<Box display='flex' alignItems='center' justifyContent='center'>
		{previous}
		<Box is='span' flexBasis={dateWidth} marginInline='x8' textAlign='center'>
			{children}
		</Box>
		{next}
	</Box>
);

export default ChartDateNavigation;
