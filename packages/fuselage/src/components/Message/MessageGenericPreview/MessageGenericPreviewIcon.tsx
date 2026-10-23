import { Icon, type IconProps } from '../../Icon';

export type MessageGenericPreviewIconProps = IconProps & {
	type: string;
};

const MessageGenericPreviewIcon = ({
	name = 'attachment-file',
	size = 32,
	color = 'default',
	type = 'file',
}: MessageGenericPreviewIconProps) => (
	<div className='rcx-message-generic-preview__icon'>
		<Icon name={name} color={color} size={size} />
		<div className='rcx-message-generic-preview__icon-title'>{type}</div>
	</div>
);

export default MessageGenericPreviewIcon;
