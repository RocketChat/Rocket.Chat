import type { IIncomingIntegration } from '@rocket.chat/core-typings';
import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import EditIncomingWebhook from './incoming/EditIncomingWebhook';
import EditOutgoingWebhook from './outgoing/EditOutgoingWebhook';

export type EditIntegrationsPageWithDataProps = { integrationId: IIncomingIntegration['_id'] };

const EditIntegrationsPageWithData = ({ integrationId }: EditIntegrationsPageWithDataProps) => {
	const { t } = useTranslation();

	const params = useMemo(() => ({ integrationId }), [integrationId]);
	const getIntegrations = useEndpoint('GET', '/v1/integrations.get');
	const { data, isPending, isError } = useQuery({
		queryKey: ['integrations', params],
		queryFn: async () => getIntegrations(params),
	});

	if (isPending) {
		return (
			<Box width='full' padding={24}>
				<Skeleton marginBlockEnd={4} />
				<Skeleton marginBlockEnd={8} />
				<Skeleton marginBlockEnd={4} />
				<Skeleton marginBlockEnd={8} />
				<Skeleton marginBlockEnd={4} />
				<Skeleton marginBlockEnd={8} />
			</Box>
		);
	}

	if (isError) {
		return <Box marginBlockStart={16}>{t('Oops_page_not_found')}</Box>;
	}

	if (data?.integration.type === 'webhook-outgoing') {
		return <EditOutgoingWebhook webhookData={data?.integration} />;
	}

	return <EditIncomingWebhook webhookData={data?.integration} />;
};

export default EditIntegrationsPageWithData;
