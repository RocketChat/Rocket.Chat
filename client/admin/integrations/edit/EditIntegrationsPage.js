import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../../components/basic/Page';
import EditIncomingWebhookWithData from './EditIncomingWebhook';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';


export default function NewIntegrationsPage({ ...props }) {
	const t = useTranslation();

	const router = useRoute('admin-integrations');

	const handleClickReturn = () => {
		router.push({ });
	};

	const type = useRouteParameter('type');
	const integrationId = useRouteParameter('id');

	return <Page flexDirection='column' {...props}>
		<Page.Header title={t('Integrations')} >
			<ButtonGroup>
				<Button onClick={handleClickReturn}>
					<Icon name='back' size='x16'/> {t('Back')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			{[
				// type === 'outgoing' && <EditOutgoingWebhook key='outgoing'/>,
				type === 'incoming' && <EditIncomingWebhookWithData integrationId={integrationId} key='incoming'/>,
			].filter(Boolean)}
		</Page.ScrollableContentWithShadow>
	</Page>;
}
