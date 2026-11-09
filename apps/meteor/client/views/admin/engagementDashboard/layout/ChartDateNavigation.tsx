import { Box, Stack } from '@rocket.chat/fuselage';
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
	<Stack direction='row' align='center' justify='center' gap='x8'>
		{previous}
		<Box is='span' flexBasis={dateWidth} textAlign='center'>
			{children}
		</Box>
		{next}
	</Stack>
);

export default ChartDateNavigation;
