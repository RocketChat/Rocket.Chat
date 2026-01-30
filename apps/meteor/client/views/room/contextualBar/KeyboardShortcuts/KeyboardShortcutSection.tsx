import { Box, Divider, Margins } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

type KeyboardShortcutSectionProps = {
	title: string;
	command: string;
};

const KeyboardShortcutSection = ({ title, command }: KeyboardShortcutSectionProps): ReactElement => (
	<Margins block={16}>
		<Box is='section' color='default'>
			<Box fontScale='p2m' fontWeight='700'>
				{title}
			</Box>
			<Divider />
			<Box fontScale='p2'>{command}</Box>
		</Box>
	</Margins>
);

export default KeyboardShortcutSection;
