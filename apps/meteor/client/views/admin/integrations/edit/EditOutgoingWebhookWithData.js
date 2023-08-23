import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import EditOutgoingWebhook from './EditOutgoingWebhook';

function EditOutgoingWebhookWithData({ integrationId, ...props }) {
	const t = useTranslation();

	const params = useMemo(() => ({ integrationId }), [integrationId]);

	const getIntegrations = useEndpoint('GET', '/v1/integrations.get');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, isLoading, error, refetch } = useQuery(
		['integrations', params],
		async () => {
			const integrations = await getIntegrations(params);
			return integrations;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	const onChange = () => {
		refetch();
	};

	if (isLoading) {
		return (
			<Box w='full' pb={24} {...props}>
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
			</Box>
		);
	}

	if (error) {
		return (
			<Box mbs={16} {...props}>
				{t('Oops_page_not_found')}
			</Box>
		);
	}

	return <EditOutgoingWebhook data={data.integration} onChange={onChange} {...props} />;
}

export default EditOutgoingWebhookWithData;
