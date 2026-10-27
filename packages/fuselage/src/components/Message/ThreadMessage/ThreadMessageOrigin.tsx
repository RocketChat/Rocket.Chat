import type { ReactNode } from 'react';

export type ThreadMessageOriginProps = {
	children?: ReactNode;
	system?: boolean;
};

const ThreadMessageOrigin = ({ children, system }: ThreadMessageOriginProps) => (
	<div
		className={['rcx-box rcx-box--full rcx-message-thread__origin', system && 'rcx-box rcx-box--full rcx-message-thread__origin--system']
			.filter(Boolean)
			.join(' ')}
	>
		{children}
	</div>
);

export default ThreadMessageOrigin;
