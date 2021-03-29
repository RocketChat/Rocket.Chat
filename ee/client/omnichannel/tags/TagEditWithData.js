import { Callout } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import TagEdit from './TagEdit';

function TagEditWithData({ tagId, reload }) {
	const query = useMemo(() => ({ tagId }), [tagId]);
	const { value: data, phase: state, error } = useEndpointData('livechat/tags.getOne', query);
	const {
		value: availableDepartments,
		phase: availableDepartmentsState,
		error: availableDepartmentsError,
	} = useEndpointData('livechat/department');

	const t = useTranslation();

	if ([state, availableDepartmentsState].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (error || availableDepartmentsError) {
		return (
			<Callout m='x16' type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return (
		<TagEdit
			tagId={tagId}
			data={data}
			availableDepartments={availableDepartments}
			reload={reload}
		/>
	);
}

export default TagEditWithData;
