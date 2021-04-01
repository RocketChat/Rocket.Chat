import { Box, Tag } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const HeaderTag: FC<ComponentProps<typeof Tag>> = ({ children, ...props }) => (
	<Tag {...props}>
		<Box display='flex' fontScale='p2'>
			{children}
		</Box>
	</Tag>
);

export default HeaderTag;
