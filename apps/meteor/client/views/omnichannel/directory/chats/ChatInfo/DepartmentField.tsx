import { Box, Skeleton } from '@rocket.chat/fuselage';
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
	const { data, isLoading, isError } = useDepartmentInfo(departmentId);

	return (
		<Field>
			<Label>{t('Department')}</Label>
			{isLoading && <Skeleton />}
			{isError && <Box color='danger'>{t('Something_went_wrong')}</Box>}
			{!isLoading && !isError && <Info>{data?.department?.name || t('Department_not_found')}</Info>}
		</Field>
	);
};

export default DepartmentField;
