import { Box, FlexItem, InputBoxSkeleton } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type EngagementDashboardCardFilterProps = {
	children?: ReactNode;
};

const EngagementDashboardCardFilter = ({ children = <InputBoxSkeleton /> }: EngagementDashboardCardFilterProps) => (
	<Box rcx-card__row display='flex' justifyContent='flex-end' alignItems='center' wrap='no-wrap' pbe={8}>
		{children && <FlexItem grow={0}>{children}</FlexItem>}
	</Box>
);

export default EngagementDashboardCardFilter;
