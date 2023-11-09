import type { IIncomingIntegration } from '@rocket.chat/core-typings';
import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import EditIncomingWebhook from './incoming/EditIncomingWebhook';
import EditOutgoingWebhook from './outgoing/EditOutgoingWebhook';

const EditIntegrationsPageWithData = ({ integrationId }: { integrationId: IIncomingIntegration['_id'] }) => {
	const t = useTranslation();

	const params = useMemo(() => ({ integrationId }), [integrationId]);
	const getIntegrations = useEndpoint('GET', '/v1/integrations.get');
	const { data, isLoading, isError } = useQuery(['integrations', params], async () => getIntegrations(params));

	if (isLoading) {
		return (
			<Box w='full' p={24}>
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
			</Box>
		);
	}

	if (isError) {
		return <Box mbs={16}>{t('Oops_page_not_found')}</Box>;
	}

	if (data?.integration.type === 'webhook-outgoing') {
		return <EditOutgoingWebhook webhookData={data?.integration} />;
	}

	return <EditIncomingWebhook webhookData={data?.integration} />;
};

export default EditIntegrationsPageWithData;
