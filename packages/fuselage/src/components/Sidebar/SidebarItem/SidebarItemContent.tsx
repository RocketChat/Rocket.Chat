import { useContext } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemDescription } from '../../Item';
import { ItemRowContext } from '../../Item/ItemContext';
import type { ItemPartAttributes } from '../../Item/types';

export const SidebarItemContent = ({ className, ...props }: ItemPartAttributes) => {
	const row = useContext(ItemRowContext);

	return <ItemDescription {...props} fill={row !== null} className={cx('rcx-sidebar-item__subtitle', className)} />;
};
