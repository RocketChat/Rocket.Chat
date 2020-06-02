import { Tabs, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { useCallback } from 'react';

import Page from '../../../components/basic/Page';
import NewIncomingWebhook from './NewIncomingWebhook';
import NewOutgoingWebhook from './NewOutgoingWebhook';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';


export default function NewIntegrationsPage({ ...props }) {
	const t = useTranslation();

	const router = useRoute('admin-integrations');

	const handleClickTab = (type) => () => {
		router.push({ context: 'new', type });
	};

	const handleClickReturn = useCallback(() => {
		router.push({ });
	}, []);

	const tab = useRouteParameter('type');

	const handleIncomingTab = useCallback(handleClickTab('incoming'), []);
	const handleOutgoingTab = useCallback(handleClickTab('outgoing'), []);

	return <Page flexDirection='column' {...props}>
		<Page.Header title={t('Integrations')} >
			<ButtonGroup>
				<Button onClick={handleClickReturn}>
					<Icon name='back' size='x16'/> {t('Back')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Tabs>
			<Tabs.Item
				selected={tab === 'incoming'}
				onClick={handleIncomingTab}
			>
				{t('Incoming')}
			</Tabs.Item>
			<Tabs.Item
				selected={tab === 'outgoing'}
				onClick={handleOutgoingTab}
			>
				{t('Outgoing')}
			</Tabs.Item>
		</Tabs>
		<Page.ScrollableContentWithShadow>
			{
				(tab === 'incoming' && <NewIncomingWebhook key='incoming'/>)
				|| (tab === 'outgoing' && <NewOutgoingWebhook key='outgoing'/>)
			}
		</Page.ScrollableContentWithShadow>
	</Page>;
}
