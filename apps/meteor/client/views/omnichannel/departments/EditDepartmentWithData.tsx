import { Box } from '@rocket.chat/fuselage';
import type { LivechatDepartmentId } from '@rocket.chat/rest-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditDepartment from './EditDepartment';
import type { EditDepartmentProps, DataType } from './EditDepartment';
import EditDepartmentWithAllowedForwardData from './EditDepartmentWithAllowedForwardData';

const params: LivechatDepartmentId = { onlyMyDepartments: 'true' };

function EditDepartmentWithData({ id, reload, title }: Pick<EditDepartmentProps, 'id' | 'reload' | 'title'>) {
	const t = useTranslation();
	const { value, phase: state, error } = useEndpointData('/v1/livechat/department/:_id', { keys: { _id: id || '' }, params });
	const data = value as DataType;

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (error || (id && !data.department)) {
		return <Box mbs='x16'>{t('Department_not_found')}</Box>;
	}
	return (
		<>
			{data?.department?.departmentsAllowedToForward && data.department?.departmentsAllowedToForward.length > 0 ? (
				<EditDepartmentWithAllowedForwardData id={id} data={data} reload={reload} title={title} />
			) : (
				<EditDepartment id={id} data={data} reload={reload} title={title} />
			)}
		</>
	);
}

export default EditDepartmentWithData;
