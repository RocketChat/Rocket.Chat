import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import StarredMessages from './StarredMessages';
import VerticalBar from '../../../../components/VerticalBar';

export default {
	title: 'components/StarredMessages',
	component: StarredMessages,
};

export const Empty = () => (
	<Box height='600px'>
		<VerticalBar>
			<StarredMessages />
		</VerticalBar>
	</Box>
);
