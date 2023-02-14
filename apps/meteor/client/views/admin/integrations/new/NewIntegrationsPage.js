import { Tabs, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useRouteParameter, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import Page from '../../../../components/Page';
import NewIncomingWebhook from './NewIncomingWebhook';
import NewOutgoingWebhook from './NewOutgoingWebhook';

export default function NewIntegrationsPage({ ...props }) {
	const t = useTranslation();

	const router = useRoute('admin-integrations');

	const handleClickTab = useCallback(
		(type) => () => {
			router.push({ context: 'new', type });
		},
		[router],
	);

	const handleClickReturn = useCallback(() => {
		router.push({});
	}, [router]);

	const tab = useRouteParameter('type');

	return (
		<Page flexDirection='column' {...props}>
			<Page.Header title={t('Integrations')}>
				<ButtonGroup>
					<Button onClick={handleClickReturn}>
						<Icon name='back' size='x16' /> {t('Back')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Tabs>
				<Tabs.Item selected={tab === 'incoming'} onClick={handleClickTab('incoming')}>
					{t('Incoming')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'outgoing'} onClick={handleClickTab('outgoing')}>
					{t('Outgoing')}
				</Tabs.Item>
			</Tabs>
			{(tab === 'incoming' && <NewIncomingWebhook key='incoming' />) || (tab === 'outgoing' && <NewOutgoingWebhook key='outgoing' />)}
		</Page>
	);
}
