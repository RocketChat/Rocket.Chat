import { Callout } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import TagEdit from './TagEdit';

function TagEditWithDepartmentData({ data, ...props }) {
	const t = useTranslation();

	const {
		value: currentDepartments,
		phase: currentDepartmentsState,
		error: currentDepartmentsError,
	} = useEndpointData(
		'livechat/department.listByIds',
		useMemo(() => ({ ids: data && data.departments ? data.departments : [] }), [data]),
	);

	if ([currentDepartmentsState].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (currentDepartmentsError) {
		return (
			<Callout m='x16' type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return <TagEdit currentDepartments={currentDepartments} data={data} {...props} />;
}

export default TagEditWithDepartmentData;
