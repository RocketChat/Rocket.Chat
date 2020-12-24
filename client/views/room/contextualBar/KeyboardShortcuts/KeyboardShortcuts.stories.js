import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import KeyboardShortcuts from './KeyboardShortcuts';
import VerticalBar from '../../../../components/VerticalBar';

export default {
	title: 'views/room/contextualBar/KeyboardShortcuts',
	component: KeyboardShortcuts,
};

export const _KeyboardShortcuts = () => <Box height='600px'>
	<VerticalBar>
		<KeyboardShortcuts />
	</VerticalBar>
</Box>;
_KeyboardShortcuts.storyName = 'KeyboardShortcuts';
