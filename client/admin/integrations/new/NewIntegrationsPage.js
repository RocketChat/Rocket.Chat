import { Tabs, Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../../components/basic/Page';
// import WebHookIntegrations from './WebHookIntegrations';
import NewZapier from './NewZapier';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';


export default function NewIntegrationsPage({ ...props }) {
	const t = useTranslation();

	const router = useRoute('admin-integrations');

	const handleClickTab = (tab) => () => {
		router.push({ context: 'new', tab });
	};

	const handleClickReturn = () => {
		router.push({ });
	};

	const tab = useRouteParameter('tab');

	return <Page flexDirection='column' {...props}>
		<Page.Header title={t('Integrations')} >
			<ButtonGroup>
				<Button onClick={handleClickReturn}>
					<Icon name='back' size='x16'/> {t('Back')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Tabs>
				<Tabs.Item
					selected={tab === 'webhooks'}
					onClick={handleClickTab('webhooks')}
				>
					{t('Webhooks')}
				</Tabs.Item>
				<Tabs.Item
					selected={tab === 'zapier'}
					onClick={handleClickTab('zapier')}
				>
					{t('Zapier')}
				</Tabs.Item>
				<Tabs.Item
					selected={tab === 'bots'}
					onClick={handleClickTab('bots')}
				>
					{t('Bots')}
				</Tabs.Item>
			</Tabs>
			{[
				// tab === 'webhooks' && <WebHookTab />,
				tab === 'bots' && <Box pb='x20' fontScale='s1' key='bots' dangerouslySetInnerHTML={{ __html: t('additional_integrations_Bots') }}/>,
				tab === 'zapier' && <NewZapier key='zapier'/>,
			].filter(Boolean)}
		</Page.ScrollableContentWithShadow>
	</Page>;
}