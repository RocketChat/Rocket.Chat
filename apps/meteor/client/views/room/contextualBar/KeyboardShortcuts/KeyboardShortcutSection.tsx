import { Box, Divider } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

type KeyboardShortcutSectionProps = {
	title: string;
	command: string;
};

const KeyboardShortcutSection = ({ title, command }: KeyboardShortcutSectionProps): ReactElement => (
	<Box is='section' mb='x16'>
		<Box fontScale='p2m' fontWeight='700'>
			{title}
		</Box>
		<Divider />
		<Box fontScale='p2'>{command}</Box>
	</Box>
);

export default KeyboardShortcutSection;
