import { Box, Tag } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type HeaderTagProps = ComponentProps<typeof Tag>;

const HeaderTag = ({ children, ...props }: HeaderTagProps) => (
	<Box p={4} withTruncatedText minWidth='x32'>
		<Tag medium {...props}>
			{children}
		</Tag>
	</Box>
);

export default HeaderTag;
