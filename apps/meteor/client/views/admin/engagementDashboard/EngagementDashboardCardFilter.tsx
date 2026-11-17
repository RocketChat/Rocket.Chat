import { Box, InputBoxSkeleton, Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type EngagementDashboardCardFilterProps = {
	children?: ReactNode;
};

const EngagementDashboardCardFilter = ({ children = <InputBoxSkeleton /> }: EngagementDashboardCardFilterProps) => (
	<Box rcx-card__row display='flex' justifyContent='flex-end' alignItems='center' wrap='no-wrap' paddingBlockEnd='x8'>
		{children && (
			<Stack direction='row' align='center' gap='x8'>
				{children}
			</Stack>
		)}
	</Box>
);

export default EngagementDashboardCardFilter;
