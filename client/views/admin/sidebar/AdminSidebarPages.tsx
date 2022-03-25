import { Box } from '@rocket.chat/fuselage';
import React, { memo, FC, useCallback } from 'react';
import { useQuery } from 'react-query';
import { useSubscription } from 'use-subscription';

import { UpgradeTabVariants } from '../../../../lib/getUpgradeTabType';
import Sidebar from '../../../components/Sidebar';
import { useEndpoint } from '../../../contexts/ServerContext';
import { itemsSubscription } from '../sidebarItems';
import UpgradeTab from './UpgradeTab';

type AdminSidebarPagesProps = {
	currentPath: string;
};

const useUpgradeTabParams = (): [data: UpgradeTabVariants | false, trialEndDate: string | undefined] => {
	const getUpgradeTabParams = useEndpoint('GET', 'cloud.getUpgradeTabParams');

	const { data } = useQuery(
		'upgradeTabType',
		useCallback(async () => getUpgradeTabParams(), [getUpgradeTabParams]),
	);

	return [data?.tabType || false, data?.trialEndDate];
};

const AdminSidebarPages: FC<AdminSidebarPagesProps> = ({ currentPath }) => {
	const items = useSubscription(itemsSubscription);
	const [upgradeTabType, trialEndDate] = useUpgradeTabParams();

	return (
		<Box display='flex' flexDirection='column' flexShrink={0} pb='x8'>
			{upgradeTabType && <UpgradeTab type={upgradeTabType} currentPath={currentPath} trialEndDate={trialEndDate} />}
			<Sidebar.ItemsAssembler items={items} currentPath={currentPath} />
		</Box>
	);
};

export default memo(AdminSidebarPages);
