import { Icon, type IconProps } from '../../Icon';

export type MessageGenericPreviewIconProps = Omit<IconProps, 'color'> & {
	type: string;
};

const MessageGenericPreviewIcon = ({ name = 'attachment-file', size = 32, type = 'file' }: MessageGenericPreviewIconProps) => (
	<div className='rcx-message-generic-preview__icon'>
		<Icon name={name} size={size} />
		<div className='rcx-message-generic-preview__icon-title'>{type}</div>
	</div>
);

export default MessageGenericPreviewIcon;
