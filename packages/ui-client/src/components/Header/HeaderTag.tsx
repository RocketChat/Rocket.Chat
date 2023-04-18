import { Box, Tag } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';

const HeaderTag: FC<ComponentProps<typeof Tag>> = ({ children, ...props }) => (
	<Box mi='x2'>
		<Tag medium {...props}>
			{children}
		</Tag>
	</Box>
);

export default HeaderTag;
