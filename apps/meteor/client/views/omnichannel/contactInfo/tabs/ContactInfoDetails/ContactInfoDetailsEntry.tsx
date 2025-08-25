import type { IconProps } from '@rocket.chat/fuselage';
import { Box, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

type ContactInfoDetailsEntryProps = Pick<ComponentProps<typeof Box>, 'is' | 'aria-labelledby'> & {
	icon: IconProps['name'];
	value: string;
	actions?: ReactNode;
};

const ContactInfoDetailsEntry = ({ icon, value, actions, ...props }: ContactInfoDetailsEntryProps) => (
	<Box display='flex' alignItems='center' {...props}>
		<Icon size='x18' mie={4} name={icon} />
		<Box withTruncatedText display='flex' flexGrow={1} alignItems='center' justifyContent='space-between'>
			<Box is='p' fontScale='p2' withTruncatedText mi={4}>
				{value}
			</Box>
			<Box display='flex' alignItems='center'>
				<ButtonGroup>{actions}</ButtonGroup>
			</Box>
		</Box>
	</Box>
);

export default ContactInfoDetailsEntry;
