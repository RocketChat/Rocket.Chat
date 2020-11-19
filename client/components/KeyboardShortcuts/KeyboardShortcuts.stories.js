import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import VerticalBar from './VerticalBar';
import KeyboardShortcuts from './KeyboardShortcuts';

export default {
	title: 'components/KeyboardShortcut',
	component: KeyboardShortcuts,
};

export const Default = () => <Box height='600px'>
	<VerticalBar>
		<KeyboardShortcuts />
	</VerticalBar>
</Box>;
