import { Box, Icon } from '@rocket.chat/fuselage';
// import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

const EmptyBody: FC = () => (
	// const t = useTranslation('No_unreads');

	<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' width='full' height='80%'>
		<Icon name='check' size='x60' color='green' />
		<Box marginBlock='x4'>
			<Box is='h3' color='default' fontScale='h3'>
				You have no unread messages at the moment!
			</Box>
		</Box>
	</Box>
);
export default memo(EmptyBody);
