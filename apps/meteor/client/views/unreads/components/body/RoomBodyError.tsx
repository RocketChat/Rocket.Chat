import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const RoomBodyError: FC = () => (
	<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' width='full' height='80%'>
		<Icon name='warning' size='x60' color='danger' />
		<Box marginBlock='x4'>
			<Box is='h3' color='default' fontScale='h3'>
				An error occurred while loading the unread messages!
			</Box>
		</Box>
	</Box>
);

export default memo(RoomBodyError);
