import type { AnchorHTMLAttributes, HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageGenericPreviewTitleProps = {
	/** Turns the title into a link that opens this address in a new tab. */
	externalUrl?: string;
} & HTMLAttributes<HTMLSpanElement> &
	AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * The title of a preview, cut short at the end of the line.
 */
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
