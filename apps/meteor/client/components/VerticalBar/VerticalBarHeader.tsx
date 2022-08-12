import { Box, Margins } from '@rocket.chat/fuselage';
import React, { FC, memo, ReactNode, ComponentProps } from 'react';

const VerticalBarHeader: FC<{ children: ReactNode; props?: ComponentProps<typeof Box> }> = ({ children, ...props }) => (
	<Box
		display='flex'
		alignItems='center'
		minHeight='56px'
		maxHeight='56px'
		is='h3'
		pi='x24'
		borderBlockEndWidth='x2'
		borderBlockColor='neutral-200'
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
			color='neutral-800'
		>
			<Margins inline='x4'>{children}</Margins>
		</Box>
	</Box>
);

export default memo(VerticalBarHeader);
