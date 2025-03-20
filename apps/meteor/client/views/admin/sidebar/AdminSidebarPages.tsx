import { Box } from '@rocket.chat/fuselage';
import { memo, useSyncExternalStore } from 'react';

import SidebarItemsAssembler from '../../../components/Sidebar/SidebarItemsAssembler';
import { subscribeToAdminSidebarItems, getAdminSidebarItems } from '../sidebarItems';

type AdminSidebarPagesProps = {
	currentPath: string;
};

const AdminSidebarPages = ({ currentPath }: AdminSidebarPagesProps) => {
	const items = useSyncExternalStore(subscribeToAdminSidebarItems, getAdminSidebarItems);

	return (
		<Box display='flex' flexDirection='column' flexShrink={0} pb={8}>
			<SidebarItemsAssembler items={items} currentPath={currentPath} />
		</Box>
	);
};

export default memo(AdminSidebarPages);
