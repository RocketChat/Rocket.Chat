import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import PageSkeleton from '../../../components/PageSkeleton';
import EditDepartment from './EditDepartment';
import UpgradeDepartments from './UpgradeDepartments';

type NewDepartmentProps = {
	id?: string;
};

const NewDepartment = ({ id }: NewDepartmentProps) => {
	const getDepartmentCreationAvailable = useEndpoint('GET', '/v1/livechat/department/isDepartmentCreationAvailable');
	const { data, isLoading } = useQuery(['getDepartments'], async () => getDepartmentCreationAvailable());

	const t = useTranslation();

	if (!data || isLoading) {
		return <PageSkeleton />;
	}
	if (data.departmentCreationAvailable === false) {
		return <UpgradeDepartments />;
	}
	// TODO: remove allowedToForwardData and data props once the EditDepartment component is migrated to TS
	return <EditDepartment id={id} title={t('New_Department')} allowedToForwardData={undefined} data={undefined} />;
};

export default NewDepartment;
