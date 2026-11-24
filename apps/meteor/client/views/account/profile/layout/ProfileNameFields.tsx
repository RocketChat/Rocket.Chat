import { Box, Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type ProfileNameFieldsProps = {
	stacked: boolean;
	name: ReactNode;
	username: ReactNode;
};

/**
 * The name and username fields, side by side at equal widths, or one above the other on narrow screens.
 */
const ProfileNameFields = ({ stacked, name, username }: ProfileNameFieldsProps) => (
	<Stack direction={stacked ? 'column' : 'row'} gap='x16'>
		<Box width='full' flexShrink={1}>
			{name}
		</Box>
		<Box width='full' flexShrink={1}>
			{username}
		</Box>
	</Stack>
);

export default ProfileNameFields;
