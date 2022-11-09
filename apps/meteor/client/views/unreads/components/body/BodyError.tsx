import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const BodyError: FC = () => (
	<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' width='full' height='80%'>
		<Icon name='warning' size='x80' color='danger' />
		<Box marginBlock='x4'>
			<Box is='h3' color='default' fontScale='h3' padding={20}>
				An error occurred while loading the unread messages!
			</Box>
		</Box>
	</Box>
);

export default memo(BodyError);
