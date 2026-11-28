import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageGenericPreviewProps = HTMLAttributes<HTMLDivElement>;

const MessageGenericPreview = ({ className, ...props }: MessageGenericPreviewProps) => (
	<div {...props} className={cx('rcx-message-generic-preview', className)} />
);

export default MessageGenericPreview;
