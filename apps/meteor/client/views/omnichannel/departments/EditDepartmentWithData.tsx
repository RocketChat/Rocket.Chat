import { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import EditDepartment from './EditDepartment';
import EditDepartmentWithAllowedForwardData from './EditDepartmentWithAllowedForwardData';
import { FormSkeleton } from '../../../components/Skeleton';

const params = { onlyMyDepartments: 'true' } as const;

type EditDepartmentWithDataProps = {
	id?: string;
	title: string;
};

const EditDepartmentWithData = ({ id, title }: EditDepartmentWithDataProps) => {
	const { t } = useTranslation();
	const getDepartment = useEndpoint('GET', '/v1/livechat/department/:_id', { _id: id ?? '' });
	const { data, isLoading, isError } = useQuery({
		queryKey: ['/v1/livechat/department/:_id', id],
		queryFn: () => getDepartment(params),
		enabled: !!id,
	});

	if (isLoading) {
		return <FormSkeleton padding='1.5rem 1rem' maxWidth='37.5rem' margin='0 auto' />;
	}

	if (isError || (id && !data?.department)) {
		return <Box mbs={16}>{t('Department_not_found')}</Box>;
	}

	if (data?.department?.archived === true) {
		return <Box mbs={16}>{t('Department_archived')}</Box>;
	}

	return (
		<>
			{data?.department?.departmentsAllowedToForward && data.department.departmentsAllowedToForward.length > 0 ? (
				<EditDepartmentWithAllowedForwardData id={id} data={data} title={title} />
			) : (
				<EditDepartment id={id} data={data} title={title} />
			)}
		</>
	);
};

export default EditDepartmentWithData;
