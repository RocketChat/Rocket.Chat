import { css } from '@rocket.chat/css-in-js';
import { Box, InputBoxSkeleton } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type EngagementDashboardCardFilterProps = {
	children?: ReactNode;
};

const filtersClassName = css`
	& > * {
		flex-grow: 0;
	}
`;

const EngagementDashboardCardFilter = ({ children = <InputBoxSkeleton /> }: EngagementDashboardCardFilterProps) => (
	<Box
		rcx-card__row
		display='flex'
		justifyContent='flex-end'
		alignItems='center'
		wrap='no-wrap'
		paddingBlockEnd={8}
		className={filtersClassName}
	>
		{children}
	</Box>
);

export default EngagementDashboardCardFilter;
