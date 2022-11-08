import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const EmptyRoomBody: FC = () => (
	<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' width='full' height='70%'>
		<Icon name='check' size='x60' color='green' />
		<Box marginBlock='x4'>
			<Box is='h3' color='default' fontScale='h3'>
				You have no unread messages for now!
			</Box>
		</Box>
	</Box>
);

export default memo(EmptyRoomBody);
