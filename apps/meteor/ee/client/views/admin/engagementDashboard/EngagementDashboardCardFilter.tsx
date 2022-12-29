import { Box, Flex, InputBox } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

type EngagementDashboardCardFilterProps = {
	children?: ReactNode;
};

const EngagementDashboardCardFilter = ({ children = <InputBox.Skeleton /> }: EngagementDashboardCardFilterProps): ReactElement => (
	<Box display='flex' justifyContent='flex-end' alignItems='center' wrap='no-wrap'>
		{children && <Flex.Item grow={0}>{children}</Flex.Item>}
	</Box>
);

export default EngagementDashboardCardFilter;
