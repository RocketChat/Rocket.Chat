import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import KeyboardShortcutsWithClose from './KeyboardShortcutsWithClose';

export default {
	title: 'room/contextualBar/KeyboardShortcut',
	component: KeyboardShortcutsWithClose,
};

export const Default = () => (
	<Box height='600px'>
		<VerticalBar>
			<KeyboardShortcutsWithClose />
		</VerticalBar>
	</Box>
);
