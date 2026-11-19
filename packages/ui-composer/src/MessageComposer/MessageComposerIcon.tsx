import { Icon, type IconProps } from '@rocket.chat/fuselage';

export type MessageComposerIconProps = Omit<IconProps, 'size' | 'color'>;

const MessageComposerIcon = ({ name, ...props }: MessageComposerIconProps) => <Icon name={name} size='x20' {...props} />;

export default MessageComposerIcon;
