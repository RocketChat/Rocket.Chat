import { SidebarAction } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import DisplayMenu from './DisplayMenu';

export type NavBarItemSortProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemSort = ({ className }: NavBarItemSortProps) => <DisplayMenu is={SidebarAction} className={className} />;

export default NavBarItemSort;
