import type { HTMLAttributes } from 'react';

import { useSidebarHighlight } from './useSidebarHighlight';
import { cx } from '../../../helpers/composeClassNames';
import { ItemTitle } from '../../Item';

export const SidebarItemTitle = ({ className, unread, children, ...props }: { unread?: boolean } & HTMLAttributes<HTMLDivElement>) => {
	const { wrapPart, wrapChildren } = useSidebarHighlight(unread);

	return wrapPart(
		<ItemTitle
			{...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)}
			className={cx('rcx-sidebar-item__title', !!unread && 'rcx-sidebar-item__title--highlighted', className)}
		>
			{wrapChildren(children)}
		</ItemTitle>,
	);
};
