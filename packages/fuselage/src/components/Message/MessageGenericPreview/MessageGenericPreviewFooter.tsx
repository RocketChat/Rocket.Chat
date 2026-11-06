import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageGenericPreviewFooterProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const MessageGenericPreviewFooter = ({ children, className, ...props }: MessageGenericPreviewFooterProps) => (
	<div {...props} className={cx('rcx-message-generic-preview__footer', className)}>
		{children}
	</div>
);

export default MessageGenericPreviewFooter;
