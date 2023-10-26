import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import type { EditDepartmentProps } from './EditDepartment';
import EditDepartment from './EditDepartment';

const EditDepartmentWithAllowedForwardData = ({ data, ...props }: Omit<EditDepartmentProps, 'allowedToForwardData'>) => {
	const t = useTranslation();
	const getDepartmentListByIds = useEndpoint('GET', '/v1/livechat/department.listByIds');

	const {
		data: allowedToForwardData,
		isInitialLoading,
		isError,
	} = useQuery(['/v1/livechat/department.listByIds', data?.department?.departmentsAllowedToForward], () =>
		getDepartmentListByIds({
			ids: data?.department?.departmentsAllowedToForward ?? [],
		}),
	);

	if (isInitialLoading) {
		return <FormSkeleton />;
	}

	if (isError) {
		return <Box mbs={16}>{t('Not_Available')}</Box>;
	}

	return <EditDepartment data={data} allowedToForwardData={allowedToForwardData} {...props} />;
};

export default EditDepartmentWithAllowedForwardData;
