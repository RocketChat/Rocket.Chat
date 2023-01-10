import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import EditIncomingWebhook from './EditIncomingWebhook';

function EditIncomingWebhookWithData({ integrationId, ...props }) {
	const t = useTranslation();

	const params = useMemo(() => ({ integrationId }), [integrationId]);

	const getIntegrations = useEndpoint('GET', '/v1/integrations.get');

	const { data, isLoading, error, refetch } = useQuery(['integrations.get', params], async () => {
		const integrations = await getIntegrations(params);
		return integrations;
	});

	const onChange = () => {
		refetch();
	};

	if (isLoading) {
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
