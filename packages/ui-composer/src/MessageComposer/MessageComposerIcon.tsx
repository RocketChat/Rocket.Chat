import { Icon } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { HTMLAttributes } from 'react';

export type MessageComposerIconProps = { name: Keys } & Omit<HTMLAttributes<HTMLElement>, 'is'>;

const MessageComposerIcon = ({ name, ...props }: MessageComposerIconProps) => (
	<Icon name={name} size='x20' marginInlineEnd={4} {...props} />
);

export default MessageComposerIcon;
