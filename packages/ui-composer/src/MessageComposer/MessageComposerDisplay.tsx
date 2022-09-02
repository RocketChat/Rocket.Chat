import type { Keys } from '@rocket.chat/icons';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

const MessageComposerDisplay = ({ icon, text, children, ...props }: { icon?: Keys; text: string; children?: ReactNode }): ReactElement => (
	<Box alignItems='center' {...props}>
		{icon && <Icon name={icon} size='x20' mie='x4' />}
		{text}
		{children}
	</Box>
);

export default MessageComposerDisplay;
