import { SidebarV2 as FuselageSidebar } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type SidebarProps = ComponentPropsWithoutRef<typeof FuselageSidebar>;

const Sidebar = (props: SidebarProps) => <FuselageSidebar {...props} />;

export default Sidebar;
