import { Box } from '@rocket.chat/fuselage';
import { Children } from 'react';
import type { ReactNode } from 'react';

type ProfileNameFieldsProps = {
	stacked: boolean;
	children: ReactNode;
};

/**
 * The name and username fields, side by side at equal widths, or one above the other on narrow screens.
 */
const ProfileNameFields = ({ stacked, children }: ProfileNameFieldsProps) => (
	<Box display='flex' flexDirection={stacked ? 'column' : 'row'} gap='x16'>
		{Children.map(children, (child) => (
			<Box width='full' flexShrink={1}>
				{child}
			</Box>
		))}
	</Box>
);

export default ProfileNameFields;
