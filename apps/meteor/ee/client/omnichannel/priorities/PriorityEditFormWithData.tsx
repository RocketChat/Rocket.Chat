import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import type { ILivechatClientPriority, PriorityEditFormProps } from './PriorityEditForm';
import PriorityEditForm from './PriorityEditForm';

type PriorityEditFormWithDataProps = Omit<PriorityEditFormProps, 'data'> & {
	priorityId: string;
};

function PriorityEditFormWithData({ priorityId, ...props }: PriorityEditFormWithDataProps): ReactElement {
	const t = useTranslation();
	const getSLA = useEndpoint('GET', `/v1/livechat/priorities/:priorityId`, { priorityId });
	const { data, isLoading, isError } = useQuery(
		['/v1/livechat/priorities', priorityId],
		() => getSLA() as Promise<ILivechatClientPriority>,
		{ cacheTime: 0 },
	);

	if (isLoading) {
		return <FormSkeleton />;
	}

	if (isError || !data) {
		return (
			<Callout m='x16' type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return <PriorityEditForm {...props} data={data} />;
}

export default PriorityEditFormWithData;
