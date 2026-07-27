import { GridItem } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';

export type HomepageGridItemProps = { children: ReactNode };

const HomepageGridItem = ({ children }: HomepageGridItemProps) => {
	const breakpoints = useBreakpoints();

	const isMedium = !breakpoints.includes('lg');

	return (
		<GridItem xs={4} sm={4} md={4} lg={6} xl={4} padding={8} maxWidth={isMedium ? '100%' : '50%'} flexGrow={1}>
			{children}
		</GridItem>
	);
};

export default HomepageGridItem;
