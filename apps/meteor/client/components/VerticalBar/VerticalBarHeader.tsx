import { Box, Margins } from '@rocket.chat/fuselage';
import type { FC, ReactNode, ComponentProps } from 'react';
import React, { memo } from 'react';

type VerticalBarHeaderProps = {
	expanded?: boolean;
	children: ReactNode;
} & ComponentProps<typeof Box>;

const VerticalBarHeader: FC<VerticalBarHeaderProps> = ({ children, expanded, ...props }) => (
	<Box
		display='flex'
		alignItems='center'
		height={expanded ? '64px' : '56px'}
		is='h3'
		pi='x24'
		borderBlockEndWidth='default'
		borderBlockColor='extra-light'
		flexShrink={0}
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
