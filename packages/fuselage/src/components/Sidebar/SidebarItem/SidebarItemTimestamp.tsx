import type { HTMLAttributes } from 'react';

import { useSidebarHighlight } from './useSidebarHighlight';
import { cx } from '../../../helpers/composeClassNames';
import { ItemMeta } from '../../Item';

export const SidebarItemTimestamp = ({ className, unread, children, ...props }: { unread?: boolean } & HTMLAttributes<HTMLDivElement>) => {
	const { wrapPart, wrapChildren } = useSidebarHighlight(unread);

	return wrapPart(
		<ItemMeta
			{...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)}
			className={cx('rcx-sidebar-item__timestamp', !!unread && 'rcx-sidebar-item__timestamp--highlighted', className)}
		>
			{wrapChildren(children)}
		</ItemMeta>,
	);
};
