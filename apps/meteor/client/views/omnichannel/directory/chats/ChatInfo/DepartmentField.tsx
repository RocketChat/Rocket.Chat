import { Box, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { useDepartmentInfo } from '../../hooks/useDepartmentInfo';

type DepartmentFieldProps = {
	departmentId: string;
};

const DepartmentField = ({ departmentId }: DepartmentFieldProps) => {
	const { t } = useTranslation();
	const { data, isPending, isError } = useDepartmentInfo(departmentId);

	return (
		<Field>
			<Label>{t('Department')}</Label>
			{isPending && <Skeleton />}
			{isError && <Box color='danger'>{t('Something_went_wrong')}</Box>}
			{!isPending && !isError && <Info>{data?.department?.name || t('Department_not_found')}</Info>}
		</Field>
	);
};

export default DepartmentField;
