import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const RoomBodyLoading: FC = () => (
	<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' width='full' height='80%'>
		<Icon name='loading' size='x60' color='grey' />
		<Box marginBlock='x4'>
			<Box is='h3' color='default' fontScale='h3'>
				Loading...
			</Box>
		</Box>
	</Box>
);

export default memo(RoomBodyLoading);
