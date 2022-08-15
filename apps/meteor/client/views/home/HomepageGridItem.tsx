import { Grid } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import React, { ReactNode, ReactElement } from 'react';

const HomepageGridItem = ({ children }: { children: ReactNode }): ReactElement => {
	const breakpoints = useBreakpoints();

	const isMedium = !breakpoints.includes('lg');

	return (
		<Grid.Item xs={4} sm={4} md={4} lg={6} xl={4} maxWidth={isMedium ? '100%' : '50%'} flexGrow={1}>
			{children}
		</Grid.Item>
	);
};

export default HomepageGridItem;
