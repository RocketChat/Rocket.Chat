import { Box, Tag } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const HeaderTag: FC<ComponentProps<typeof Tag>> = ({ children, ...props }) => (
	<Box mi='x4'>
		<Tag {...props}>
			<Box alignItems='center' fontScale='c2' display='flex'>
				{children}
			</Box>
		</Tag>
	</Box>
);

export default HeaderTag;
