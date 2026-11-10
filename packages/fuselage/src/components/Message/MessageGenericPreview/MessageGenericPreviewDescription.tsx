import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageGenericPreviewDescriptionProps = {
	children?: ReactNode;
	clamp?: boolean;
} & HTMLAttributes<HTMLDivElement>;

const MessageGenericPreviewDescription = ({ children, clamp = false, className, ...props }: MessageGenericPreviewDescriptionProps) => (
	<div
		{...props}
		className={cx('rcx-message-generic-preview__description', clamp && 'rcx-message-generic-preview__description--clamp', className)}
	>
		{children}
	</div>
);

export default MessageGenericPreviewDescription;
