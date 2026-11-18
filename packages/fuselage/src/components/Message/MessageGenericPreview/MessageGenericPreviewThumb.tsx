import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageGenericPreviewThumbProps = HTMLAttributes<HTMLDivElement>;

/**
 * A square box before a preview's text, for a thumbnail image. Pass it as the `thumb` of `MessageGenericPreviewContent`.
 */
const MessageGenericPreviewThumb = ({ className, ...props }: MessageGenericPreviewThumbProps) => (
	<div {...props} className={cx('rcx-message-generic-preview__thumb', className)} />
);

export default MessageGenericPreviewThumb;
