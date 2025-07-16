import { Sidebar as FuselageSidebar } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type SidebarProps = ComponentPropsWithoutRef<typeof FuselageSidebar>;

const Sidebar = (props: SidebarProps) => <FuselageSidebar {...props} role='navigation' display='flex' flexDirection='column' h='full' />;

export default Sidebar;
