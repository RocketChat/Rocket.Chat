/* eslint-disable complexity */
import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditDepartment from './EditDepartment';
import EditDepartmentWithAllowedForwardData from './EditDepartmentWithAllowedForwardData';

const param = { onlyMyDepartments: true };
function EditDepartmentWithData({ id, reload, title }) {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`livechat/department/${id}`, param);

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (error || (id && !data?.department)) {
		return <Box mbs='x16'>{t('Department_not_found')}</Box>;
	}
	return (
		<>
			{data &&
			data.department &&
			data.department.departmentsAllowedToForward &&
			data.department.departmentsAllowedToForward.length > 0 ? (
				<EditDepartmentWithAllowedForwardData id={id} data={data} reload={reload} title={title} />
			) : (
				<EditDepartment id={id} data={data} reload={reload} title={title} />
			)}
		</>
	);
}

export default EditDepartmentWithData;
