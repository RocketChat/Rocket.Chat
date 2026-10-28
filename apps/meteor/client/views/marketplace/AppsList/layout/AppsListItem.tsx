import type { ReactNode } from 'react';

type AppsListItemProps = {
	className?: string;
	children: ReactNode;
};

/**
 * The list item an app card sits in, taking the spacing class its card group hands it.
 */
const AppsListItem = ({ className, children }: AppsListItemProps) => (
	<div role='listitem' className={className}>
		{children}
	</div>
);

export default AppsListItem;
