import type { HTMLAttributes } from 'react';

export type ThreadMessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const ThreadMessageLeftContainer = (props: ThreadMessageLeftContainerProps) => (
	<div className='rcx-box rcx-box--full rcx-message-container rcx-message-container--left' {...props} />
);

export default ThreadMessageLeftContainer;
