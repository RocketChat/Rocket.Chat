import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditDepartment from './EditDepartment';

function EditDepartmentWithAllowedForwardData({ data, ...props }) {
	const t = useTranslation();

	const {
		value: allowedToForwardData,
		phase: allowedToForwardState,
		error: allowedToForwardError,
	} = useEndpointData(
		'livechat/department.listByIds',
		useMemo(
			() => ({
				ids: data && data.department && data.department.departmentsAllowedToForward ? data.department.departmentsAllowedToForward : [],
			}),
			[data],
		),
	);

	if ([allowedToForwardState].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (allowedToForwardError) {
		return <Box mbs='x16'>{t('Not_Available')}</Box>;
	}
	return <EditDepartment data={data} allowedToForwardData={allowedToForwardData} {...props} />;
}

export default EditDepartmentWithAllowedForwardData;
