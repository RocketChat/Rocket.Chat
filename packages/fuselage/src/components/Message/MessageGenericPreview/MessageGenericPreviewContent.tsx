import type { ReactNode } from 'react';

export type MessageGenericPreviewContentProps = {
	children?: ReactNode;
	thumb?: ReactNode;
};

const MessageGenericPreviewContent = ({ thumb, ...props }: MessageGenericPreviewContentProps) => (
	<div className='rcx-message-generic-preview__content'>
		{thumb}
		<div className='rcx-message-generic-preview__content-wrapper' {...props} />
	</div>
);

export default MessageGenericPreviewContent;
