import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useMultipleDepartmentsAvailable } from '../../../components/Omnichannel/hooks/useMultipleDepartmentsAvailable';
import PageSkeleton from '../../../components/PageSkeleton';
import EditDepartment from './EditDepartment';
import UpgradeDepartments from './UpgradeDepartments';

type NewDepartmentProps = {
	id: string;
	reload: () => void;
};

const NewDepartment = ({ id, reload }: NewDepartmentProps) => {
	const isMultipleDepartmentsAvailable = useMultipleDepartmentsAvailable();
	const t = useTranslation();

	if (isMultipleDepartmentsAvailable === 'loading' || undefined) {
		return <PageSkeleton />;
	}
	if (!isMultipleDepartmentsAvailable) {
		return <UpgradeDepartments />;
	}
	return <EditDepartment id={id} reload={reload} title={t('New_Department')} />;
};

export default NewDepartment;
