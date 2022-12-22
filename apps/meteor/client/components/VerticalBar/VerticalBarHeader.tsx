import { Box, Margins } from '@rocket.chat/fuselage';
import type { FC, ReactNode, ComponentProps } from 'react';
import React, { memo } from 'react';

const VerticalBarHeader: FC<{ children: ReactNode; props?: ComponentProps<typeof Box> }> = ({ children, ...props }) => (
	<Box
		display='flex'
		alignItems='center'
		minHeight='56px'
		maxHeight='56px'
		is='h3'
		pi='x24'
		borderBlockEndWidth='x2'
		borderBlockColor='extra-light'
		{...props}
	>
		<Box
			marginInline='neg-x4'
			display='flex'
			alignItems='center'
			justifyContent='space-between'
			fontScale='h4'
			flexGrow={1}
			overflow='hidden'
			color='default'
		>
			<Margins inline='x4'>{children}</Margins>
		</Box>
	</Box>
);

export default memo(VerticalBarHeader);
