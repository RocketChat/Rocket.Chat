import { Icon } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { HTMLAttributes, ReactElement } from 'react';

const MessageComposerIcon = ({ name, ...props }: { name: Keys } & Omit<HTMLAttributes<HTMLElement>, 'is'>): ReactElement => (
	<Icon name={name} size='x20' mie={4} {...props} />
);

export default MessageComposerIcon;
