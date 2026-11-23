import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import DisplayMenu from '../../navbar/NavBarPagesGroup/DisplayMenu';

type SidebarRailSortProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailSort = ({ className }: SidebarRailSortProps) => (
	<DisplayMenu is={NavBarItem} placement='right-start' className={className} />
);

export default SidebarRailSort;
