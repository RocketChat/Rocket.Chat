import type { ReactNode } from 'react';

export type MessageGenericPreviewFooterProps = {
	children?: ReactNode;
	clamp?: boolean;
};

const MessageGenericPreviewFooter = ({ children }: MessageGenericPreviewFooterProps) => (
	<div className='rcx-message-generic-preview__footer'>{children}</div>
);

export default MessageGenericPreviewFooter;
