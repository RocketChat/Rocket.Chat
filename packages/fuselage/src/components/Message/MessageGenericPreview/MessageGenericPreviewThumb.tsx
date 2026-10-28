import type { HTMLAttributes } from 'react';

export type MessageGenericPreviewThumbProps = HTMLAttributes<HTMLDivElement>;

const MessageGenericPreviewThumb = (props: MessageGenericPreviewThumbProps) => (
	<div className='rcx-message-generic-preview__thumb' {...props} />
);

export default MessageGenericPreviewThumb;
