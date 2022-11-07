import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import SlaEdit from './SlaEdit';

type SlaEditProps = {
	slaId: string;
	reload: () => void;
};

function SlaEditWithData({ slaId, reload }: SlaEditProps): ReactElement {
	const { value: data, phase: state, error } = useEndpointData(`/v1/livechat/sla/${slaId}`);
	const t = useTranslation();

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !data) {
		return (
			<Callout m='x16' type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return <SlaEdit slaId={slaId} data={data} reload={reload} />;
}

export default SlaEditWithData;
