import type { ReactNode } from 'react';

export type ThreadMessageListFrameProps = {
	/** Hides the senders' usernames, as the user's preference asks. */
	hideUsernames?: boolean;
	children: ReactNode;
};

/**
 * The scrolling frame of the thread's message list, which takes the remaining height above the composer.
 */
const ThreadMessageListFrame = ({ hideUsernames, children }: ThreadMessageListFrameProps) => (
	<div className={['thread-list js-scroll-thread', hideUsernames && 'hide-usernames'].filter(Boolean).join(' ')}>{children}</div>
);

export default ThreadMessageListFrame;
