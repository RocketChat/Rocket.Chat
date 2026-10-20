import type { HTMLAttributes } from 'react';

import { useSidebarHighlight } from './useSidebarHighlight';
import { cx } from '../../../helpers/composeClassNames';
import { ItemDescription } from '../../Item';

export const SidebarItemContent = ({ className, unread, children, ...props }: { unread?: boolean } & HTMLAttributes<HTMLDivElement>) => {
	const { wrapPart, wrapChildren } = useSidebarHighlight(unread);

	return wrapPart(
		<ItemDescription
			{...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)}
			className={cx('rcx-sidebar-item__subtitle', !!unread && 'rcx-sidebar-item__subtitle--highlighted', className)}
		>
			{wrapChildren(children)}
		</ItemDescription>,
	);
};
