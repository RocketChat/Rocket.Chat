import type { AnchorHTMLAttributes, HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageGenericPreviewTitleProps = {
	externalUrl?: string;
} & HTMLAttributes<HTMLSpanElement> &
	AnchorHTMLAttributes<HTMLAnchorElement>;

const MessageGenericPreviewTitle = ({ externalUrl, children, className, ...props }: MessageGenericPreviewTitleProps) => {
	if (externalUrl) {
		return (
			<a
				href={externalUrl}
				// oxlint-disable-next-line react/jsx-no-target-blank -- adding rel=noreferrer would stop sending the Referer header to linked sites, a behavior change for consumers of this published component
				target='_blank'
				{...props}
				className={cx('rcx-message-generic-preview__title rcx-message-generic-preview__title-link', className)}
			>
				{children}
			</a>
		);
	}

	return (
		<span {...props} className={cx('rcx-message-generic-preview__title', className)}>
			{children}
		</span>
	);
};

export default MessageGenericPreviewTitle;
