import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageGenericPreviewDescriptionProps = {
	children?: ReactNode;
	/** Allows two lines before the text is cut short, instead of one. */
	clamp?: boolean;
} & HTMLAttributes<HTMLDivElement>;

/**
 * The text under a preview's title, cut short at the end of the line.
 */
const MessageGenericPreviewDescription = ({ children, clamp = false, className, ...props }: MessageGenericPreviewDescriptionProps) => (
	<div
		{...props}
		className={cx('rcx-message-generic-preview__description', clamp && 'rcx-message-generic-preview__description--clamp', className)}
	>
		{children}
	</div>
);

export default MessageGenericPreviewDescription;
