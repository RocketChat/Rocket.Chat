import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import * as UserStatus from '../UserStatus';

const Username = ({ name, status = <UserStatus.Offline />, title, ...props }) => (
	<Box {...props} display='flex' title={title} flexShrink={0} alignItems='center' fontScale='h4' color='default' withTruncatedText>
		{status}{' '}
		<Box mis='x8' flexGrow={1} withTruncatedText>
			{name}
		</Box>
	</Box>
);

export default Username;
