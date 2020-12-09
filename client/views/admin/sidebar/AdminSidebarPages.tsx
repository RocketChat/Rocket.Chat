import { Box } from '@rocket.chat/fuselage';
import React, { memo, FC } from 'react';
import { useSubscription } from 'use-subscription';

import Sidebar from '../../../components/Sidebar';
import { itemsSubscription } from '../sidebarItems';

type AdminSidebarPagesProps = {
	currentPath: string;
};

const AdminSidebarPages: FC<AdminSidebarPagesProps> = ({ currentPath }) => {
	const items = useSubscription(itemsSubscription);

	return <Box display='flex' flexDirection='column' flexShrink={0} pb='x8'>
		<Sidebar.ItemsAssembler items={items} currentPath={currentPath}/>
	</Box>;
};

export default memo(AdminSidebarPages);
