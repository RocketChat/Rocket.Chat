import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';

import HeaderDivider from './HeaderDivider';

export const HeaderSection = (props: ComponentProps<typeof Box>) => {
	const { isMobile } = useLayout();

	return (
		<>
			<Box
				mi='neg-x4'
				pi={isMobile ? 'x12' : 'x24'}
				pb='x8'
				display='flex'
				flexGrow={1}
				justifyContent='center'
				alignItems='center'
				overflow='hidden'
				flexDirection='row'
				{...props}
			/>
			<HeaderDivider />
		</>
	);
};
