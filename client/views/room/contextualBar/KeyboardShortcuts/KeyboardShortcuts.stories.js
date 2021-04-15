import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import KeyboardShortcutsWithClose from './KeyboardShortcutsWithClose';

export default {
	title: 'components/KeyboardShortcut',
	component: KeyboardShortcutsWithClose,
};

export const Default = () => (
	<Box height='600px'>
		<VerticalBar>
			<KeyboardShortcutsWithClose />
		</VerticalBar>
	</Box>
);
