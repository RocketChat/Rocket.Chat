import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar/VerticalBar';

type RoomLayoutProps = {
	header?: ReactNode;
	body?: ReactNode;
	footer?: ReactNode;
	aside?: ReactNode;
} & ComponentProps<typeof Box>;

const RoomLayout = ({ header, body, footer, aside, ...props }: RoomLayoutProps): ReactElement => (
	<Box is='main' h='full' display='flex' flexDirection='column' {...props}>
		{header}
		<Box display='flex' flexGrow={1} overflow='hidden' height='full' position='relative'>
			<Box display='flex' flexDirection='column' flexGrow={1}>
				<Box is='div' display='flex' flexDirection='column' flexGrow={1}>
					{body}
				</Box>
				{footer && <Box is='footer'>{footer}</Box>}
			</Box>
			{aside && <VerticalBar is='aside'>{aside}</VerticalBar>}
		</Box>
	</Box>
);

export default RoomLayout;
