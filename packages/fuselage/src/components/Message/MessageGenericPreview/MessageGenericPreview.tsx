import type { HTMLAttributes } from 'react';

export type MessageGenericPreviewProps = HTMLAttributes<HTMLDivElement>;

const MessageGenericPreview = (props: MessageGenericPreviewProps) => <div className='rcx-message-generic-preview' {...props} />;

export default MessageGenericPreview;
