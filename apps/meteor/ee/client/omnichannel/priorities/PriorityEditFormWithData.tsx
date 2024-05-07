import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { usePriorityInfo } from '../../../../client/views/omnichannel/directory/hooks/usePriorityInfo';
import type { PriorityEditFormProps } from './PriorityEditForm';
import PriorityEditForm from './PriorityEditForm';

type PriorityEditFormWithDataProps = Omit<PriorityEditFormProps, 'data'> & {
	priorityId: string;
};

function PriorityEditFormWithData({ priorityId, ...props }: PriorityEditFormWithDataProps): ReactElement {
	const t = useTranslation();
	const { data, isInitialLoading, isError } = usePriorityInfo(priorityId);

	if (isInitialLoading) {
		return <FormSkeleton />;
	}

	if (isError || !data) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return <PriorityEditForm {...props} data={data} />;
}

export default PriorityEditFormWithData;
