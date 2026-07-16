import { Sidebar as FuselageSidebar } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type SidebarProps = ComponentPropsWithoutRef<typeof FuselageSidebar>;

const Sidebar = (props: SidebarProps) => (
	<FuselageSidebar {...props} role='navigation' display='flex' flexDirection='column' height='full' />
);

export default Sidebar;
