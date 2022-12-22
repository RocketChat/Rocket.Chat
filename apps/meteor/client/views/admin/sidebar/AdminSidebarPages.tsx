import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { memo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import SidebarItemsAssembler from '../../../components/Sidebar/SidebarItemsAssembler';
import { useUpgradeTabParams } from '../../hooks/useUpgradeTabParams';
import { subscribeToAdminSidebarItems, getAdminSidebarItems } from '../sidebarItems';
import UpgradeTab from './UpgradeTab';

type AdminSidebarPagesProps = {
	currentPath: string;
};

const AdminSidebarPages: FC<AdminSidebarPagesProps> = ({ currentPath }) => {
	const items = useSyncExternalStore(subscribeToAdminSidebarItems, getAdminSidebarItems);

	const { tabType, trialEndDate, isLoading } = useUpgradeTabParams();

	return (
		<Box display='flex' flexDirection='column' flexShrink={0} pb='x8'>
			{!isLoading && tabType && <UpgradeTab type={tabType} currentPath={currentPath} trialEndDate={trialEndDate} />}
			<SidebarItemsAssembler items={items} currentPath={currentPath} />
		</Box>
	);
};

export default memo(AdminSidebarPages);
