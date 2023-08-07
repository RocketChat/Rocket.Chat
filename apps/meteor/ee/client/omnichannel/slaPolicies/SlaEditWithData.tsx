import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import SlaEdit from './SlaEdit';

type SlaEditProps = {
	slaId: string;
	reload: () => void;
};

function SlaEditWithData({ slaId, reload }: SlaEditProps): ReactElement {
	const getSLA = useEndpoint('GET', `/v1/livechat/sla/:slaId`, { slaId });
	const { data, isLoading, isError } = useQuery(['/v1/livechat/sla', slaId], () => getSLA());
	const t = useTranslation();

	if (isLoading) {
		return <FormSkeleton />;
	}

	if (isError || !data) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return <SlaEdit slaId={slaId} data={data} reload={reload} />;
}

export default SlaEditWithData;
