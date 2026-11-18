import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageGenericPreviewFooterProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

/**
 * A line of secondary text at the bottom of a preview, such as the name of the site or the author.
 */
const MessageGenericPreviewFooter = ({ children, className, ...props }: MessageGenericPreviewFooterProps) => (
	<div {...props} className={cx('rcx-message-generic-preview__footer', className)}>
		{children}
	</div>
);

export default MessageGenericPreviewFooter;
