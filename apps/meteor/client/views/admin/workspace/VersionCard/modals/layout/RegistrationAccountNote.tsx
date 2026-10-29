import { Box, Text } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type RegistrationAccountNoteProps = {
	title: ReactNode;
	children: ReactNode;
};

/**
 * A note in small print on registering with or without a cloud account: a bold title, then the details.
 */
const RegistrationAccountNote = ({ title, children }: RegistrationAccountNoteProps) => (
	<Box fontSize='c1'>
		<Text is='p'>
			<strong>{title}</strong>
		</Text>
		<Text is='p'>{children}</Text>
	</Box>
);

export default RegistrationAccountNote;
