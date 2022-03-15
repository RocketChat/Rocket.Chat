import { Box } from '@rocket.chat/fuselage';
import React, { memo, FC } from 'react';
import { useSubscription } from 'use-subscription';

import Sidebar from '../../../components/Sidebar';
import { itemsSubscription } from '../sidebarItems';
import UpgradeTab from './UpgradeTab';
import { getUpgradeTabType } from './getUpgradeTabType';

type AdminSidebarPagesProps = {
	currentPath: string;
};

const AdminSidebarPages: FC<AdminSidebarPagesProps> = ({ currentPath }) => {
	const items = useSubscription(itemsSubscription);
	const upgradeTabType = getUpgradeTabType({
		isEnterprise: false,
		isTrial: false,
		hadExpiredTrials: false,
		registered: false,
	});

	return (
		<Box display='flex' flexDirection='column' flexShrink={0} pb='x8'>
			{upgradeTabType && <UpgradeTab type={upgradeTabType} />}
			<Sidebar.ItemsAssembler items={items} currentPath={currentPath} />
		</Box>
	);
};

export default memo(AdminSidebarPages);
