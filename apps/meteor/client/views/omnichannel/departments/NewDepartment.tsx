import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import PageSkeleton from '../../../components/PageSkeleton';
import EditDepartment from './EditDepartment';
import UpgradeDepartments from './UpgradeDepartments';

type NewDepartmentProps = {
	id: string;
	reload: () => void;
};

const NewDepartment = ({ id, reload }: NewDepartmentProps) => {
	const getDepartments = useEndpoint('GET', '/v1/livechat/department');
	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const { data, isLoading } = useQuery(['omnichannel', 'departments', 'new'], async () => getDepartments());

	const t = useTranslation();

	if (isLoading || hasLicense === 'loading') {
		return <PageSkeleton />;
	}
	if (!hasLicense && data?.total && data.total >= 1) {
		return <UpgradeDepartments />;
	}
	// TODO: remove allowedToForwardData and data props once the EditDepartment component is migrated to TS
	return <EditDepartment id={id} reload={reload} title={t('New_Department')} allowedToForwardData={undefined} data={undefined} />;
};

export default NewDepartment;
