import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { FormSkeleton } from '../../Skeleton';
import { useDepartment } from './hooks/useDepartment';

const DepartmentField = ({ departmentId }) => {
	const t = useTranslation();
	const { data, isLoading, isError } = useDepartment(departmentId);

	if (!data || isLoading || isError) {
		return <FormSkeleton />;
	}

	const {
		department: { name },
	} = data;

	return (
		<Field>
			<Label>{t('Department')}</Label>
			<Info>{name || t('Department_not_found')}</Info>
		</Field>
	);
};

export default DepartmentField;
