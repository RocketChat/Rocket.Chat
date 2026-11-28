import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageGenericPreviewThumbProps = HTMLAttributes<HTMLDivElement>;

const MessageGenericPreviewThumb = ({ className, ...props }: MessageGenericPreviewThumbProps) => (
	<div {...props} className={cx('rcx-message-generic-preview__thumb', className)} />
);

export default MessageGenericPreviewThumb;
