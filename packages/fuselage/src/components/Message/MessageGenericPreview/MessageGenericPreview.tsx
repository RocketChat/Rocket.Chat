import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageGenericPreviewProps = HTMLAttributes<HTMLDivElement>;

/**
 * A card in a message for a link preview or an attachment: an image, or a title and description with an optional
 * thumbnail or file icon. Place it in a `MessageBlock`.
 */
const MessageGenericPreview = ({ className, ...props }: MessageGenericPreviewProps) => (
	<div {...props} className={cx('rcx-message-generic-preview', className)} />
);

export default MessageGenericPreview;
