import { Box } from '@rocket.chat/fuselage';
import React, { memo, FC } from 'react';
import { useSubscription } from 'use-subscription';

import Sidebar from '../../../components/Sidebar';
import { useUpgradeTabParams } from '../../hooks/useUpgradeTabParams';
import { itemsSubscription } from '../sidebarItems';
import UpgradeTab from './UpgradeTab';

type AdminSidebarPagesProps = {
	currentPath: string;
};

const AdminSidebarPages: FC<AdminSidebarPagesProps> = ({ currentPath }) => {
	const items = useSubscription(itemsSubscription);
	const { tabType, trialEndDate, isLoading } = useUpgradeTabParams();

	return (
		<Box display='flex' flexDirection='column' flexShrink={0} pb='x8'>
			{!isLoading && tabType && <UpgradeTab type={tabType} currentPath={currentPath} trialEndDate={trialEndDate} />}
			<Sidebar.ItemsAssembler items={items} currentPath={currentPath} />
		</Box>
	);
};

export default memo(AdminSidebarPages);
