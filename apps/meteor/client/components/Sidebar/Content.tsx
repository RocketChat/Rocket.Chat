import { Box } from '@rocket.chat/fuselage';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import type { ComponentPropsWithoutRef } from 'react';

type ContentProps = ComponentPropsWithoutRef<typeof CustomScrollbars>;

const Content = ({ children, ...props }: ContentProps) => (
	<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} overflow='hidden'>
		<CustomScrollbars {...props}>
			<Box display='flex' flexDirection='column' w='full' h='full'>
				{children}
			</Box>
		</CustomScrollbars>
	</Box>
);

export default Content;
