import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import TagEdit from './TagEdit';

function TagNew({ reload }) {
	const t = useTranslation();

	const {
		value: availableDepartments,
		phase: availableDepartmentsState,
		error: availableDepartmentsError,
	} = useEndpointData('livechat/department');

	if (availableDepartmentsState === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (availableDepartmentsError) {
		return <Box mbs='x16'>{t('Not_found')}</Box>;
	}

	return <TagEdit reload={reload} isNew availableDepartments={availableDepartments} />;
}

export default TagNew;
