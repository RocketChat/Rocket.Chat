import { Callout } from '@rocket.chat/fuselage';
import React from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import CannedResponseEdit from './CannedResponseEdit';

function CannedResponseEditWithData({ cannedResponseId, reload, title }) {
	const {
		value: data,
		phase: state,
		error,
	} = useEndpointData(`canned-responses/${cannedResponseId}`);

	const t = useTranslation();

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error) {
		return (
			<Callout m='x16' type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return (
		<CannedResponseEdit
			title={title}
			cannedResponseId={cannedResponseId}
			data={data}
			reload={reload}
		/>
	);
}

export default CannedResponseEditWithData;
