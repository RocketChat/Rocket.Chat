import { Icon, type IconProps } from '../../Icon';

export type MessageGenericPreviewIconProps = Omit<IconProps, 'color'> & {
	/** Short label under the icon, such as the file's extension. */
	type: string;
};

/**
 * A file badge before a preview's text, for an attachment with no image to show: an icon over a short label.
 */
const MessageGenericPreviewIcon = ({ name = 'attachment-file', size = 32, type = 'file', ...props }: MessageGenericPreviewIconProps) => (
	<div className='rcx-message-generic-preview__icon'>
		<Icon {...props} name={name} size={size} />
		<div className='rcx-message-generic-preview__icon-title'>{type}</div>
	</div>
);

export default MessageGenericPreviewIcon;
