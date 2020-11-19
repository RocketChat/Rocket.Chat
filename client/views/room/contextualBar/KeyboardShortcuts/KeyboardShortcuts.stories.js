import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import KeyboardShortcuts from './KeyboardShortcuts';
import VerticalBar from '../../../../components/VerticalBar';

export default {
	title: 'components/KeyboardShortcut',
	component: KeyboardShortcuts,
};

export const Default = () => <Box height='600px'>
	<VerticalBar>
		<KeyboardShortcuts />
	</VerticalBar>
</Box>;
