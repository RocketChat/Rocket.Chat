import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import EditIncomingWebhook from './EditIncomingWebhook';

function EditIncomingWebhookWithData({ integrationId, ...props }) {
	const t = useTranslation();

	const params = useMemo(() => ({ integrationId }), [integrationId]);
	const { value: data, phase: state, error, reload } = useEndpointData('integrations.get', params);

	const onChange = () => {
		reload();
	};

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box w='full' pb='x24' {...props}>
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
			</Box>
		);
	}

	if (error) {
		return (
			<Box mbs='x16' {...props}>
				{t('Oops_page_not_found')}
			</Box>
		);
	}

	return <EditIncomingWebhook data={data.integration} onChange={onChange} {...props} />;
}

export default EditIncomingWebhookWithData;
