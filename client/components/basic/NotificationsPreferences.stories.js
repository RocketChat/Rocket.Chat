import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import VerticalBar from './VerticalBar';
import NotificationsPreferences from './NotificationsPreferences';

export default {
	title: 'components/basic/NotificationsPreferences',
	component: NotificationsPreferences,
};

export const Default = () => <Box height='600px'>
	<VerticalBar>
		<NotificationsPreferences handleOn={() => {}} handleOptions={() => {}}/>
	</VerticalBar>
</Box>;
