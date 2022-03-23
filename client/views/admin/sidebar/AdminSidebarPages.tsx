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

const useUpgradeTabType = (): [data: UpgradeTabVariants | false, isLoading: boolean] => {
	const getUpgradeTabType = useEndpoint('GET', 'cloud.getUpgradeTabType');

	const { data, isLoading } = useQuery(
		'upgradeTabType',
		useCallback(async () => getUpgradeTabType(), [getUpgradeTabType]),
	);

	console.log(data);

	return [data?.tabType || false, isLoading];
};

const AdminSidebarPages: FC<AdminSidebarPagesProps> = ({ currentPath }) => {
	const items = useSubscription(itemsSubscription);
	const [upgradeTabType] = useUpgradeTabType();

	console.log(upgradeTabType);

	return (
		<Box display='flex' flexDirection='column' flexShrink={0} pb='x8'>
			{upgradeTabType && <UpgradeTab type={upgradeTabType} currentPath={currentPath} />}
			<Sidebar.ItemsAssembler items={items} currentPath={currentPath} />
		</Box>
	);
};

export default memo(AdminSidebarPages);
