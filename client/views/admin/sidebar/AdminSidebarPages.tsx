import { Box } from '@rocket.chat/fuselage';
import React, { memo, FC } from 'react';
import { useQuery } from 'react-query';
import { useSubscription } from 'use-subscription';

import { ILicense } from '../../../../ee/app/license/definitions/ILicense';
import Sidebar from '../../../components/Sidebar';
import { useMethod, useEndpoint } from '../../../contexts/ServerContext';
// import { AsyncStatePhase } from '../../../lib/asyncState';
import { getUpgradeTabType } from '../UpgradePage/getUpgradeTabType';
import { itemsSubscription } from '../sidebarItems';
import UpgradeTab from './UpgradeTab';

type AdminSidebarPagesProps = {
	currentPath: string;
};

const getIsTrial = (licenses: ILicense[]): boolean => !licenses.map(({ meta }) => meta?.trial).includes(false);

const getHasGoldLicense = (licenses: ILicense[]): boolean => !licenses.map(({ tag }) => tag?.name === 'gold').includes(true);

const fetchUpgradeTabType = async (getLicenses, getRegisterStatus): ReturnType<typeof getUpgradeTabType> => {
	try {
		const [{ licenses }, status] = await Promise.all([getLicenses(), getRegisterStatus()]);
		console.log(status, licenses);

		return getUpgradeTabType({
			registered: status.workspaceRegistered,
			hasValidLicense: licenses.length,
			hadExpiredTrials: false,
			isTrial: getIsTrial(licenses),
			hasGoldLicense: getHasGoldLicense(licenses),
		});
	} catch (error) {
		throw error;
	}
};

const useUpgradeTabType = () => {
	const getLicenses = useEndpoint('GET', 'licenses.get');
	const getRegisterStatus = useMethod('cloud:checkRegisterStatus');

	const { data, isLoading } = useQuery('registerStatus', async () => fetchUpgradeTabType(getLicenses, getRegisterStatus));

	console.log(data);
	return [data, isLoading];
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
