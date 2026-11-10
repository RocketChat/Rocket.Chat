import type { AnchorHTMLAttributes, HTMLAttributes } from 'react';

export type MessageGenericPreviewTitleProps = {
	externalUrl?: string;
} & HTMLAttributes<HTMLSpanElement> &
	AnchorHTMLAttributes<HTMLAnchorElement>;

const MessageGenericPreviewTitle = ({ externalUrl, children, ...props }: MessageGenericPreviewTitleProps) => {
	if (externalUrl) {
		return (
			<a
				className='rcx-message-generic-preview__title rcx-message-generic-preview__title-link'
				href={externalUrl}
				target='_blank'
				{...props}
			>
				{children}
			</a>
		);
	}

	return <span className='rcx-message-generic-preview__title' {...props} />;
};

export default MessageGenericPreviewTitle;
