import { Box, Tag } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const HeaderTag: FC<ComponentProps<typeof Tag>> = ({ children, ...props }) => (
	<Box display='flex' minWidth='65px' mi='x4'>
		<Tag {...props}>
			<Box alignItems='center' fontScale='c2' display='flex' minWidth={0}>
				{children}
			</Box>
		</Tag>
	</Box>
);

export default HeaderTag;
