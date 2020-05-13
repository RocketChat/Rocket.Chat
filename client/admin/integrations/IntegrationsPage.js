import { Button, ButtonGroup, Icon, Tabs } from '@rocket.chat/fuselage';
import React, { useEffect } from 'react';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import IntegrationsTable from './IntegrationsTable';
import NewZapier from './new/NewZapier';
import NewBot from './new/NewBot';

function IntegrationsPage() {
	const t = useTranslation();

	const router = useRoute('admin-integrations');


	const handleNewButtonClick = () => {
		router.push({ context: 'new', type: 'incoming' });
	};

	const context = useRouteParameter('context');
	useEffect(() => {
		if (!context) {
			router.push({ context: 'webhook-incoming' });
		}
	}, [context]);

	const showTable = context !== 'zapier' && context !== 'bots';

	return <Page flexDirection='column'>
		<Page.Header title={t('Integrations')}>
			<ButtonGroup>
				<Button onClick={handleNewButtonClick}>
					<Icon name='plus'/> {t('New')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.Content>
			<Tabs>
				<Tabs.Item selected={context === 'webhook-incoming'} onClick={() => router.push({ context: 'webhook-incoming' })}>{t('Incoming')}</Tabs.Item>
				<Tabs.Item selected={context === 'webhook-outgoing'} onClick={() => router.push({ context: 'webhook-outgoing' })}>{t('Outgoing')}</Tabs.Item>
				<Tabs.Item selected={context === 'zapier'} onClick={() => router.push({ context: 'zapier' })}>{t('Zapier')}</Tabs.Item>
				<Tabs.Item selected={context === 'bots'} onClick={() => router.push({ context: 'bots' })}>{t('Bots')}</Tabs.Item>
			</Tabs>
			{context === 'zapier' && <NewZapier />}
			{context === 'bots' && <NewBot />}
			{showTable && <IntegrationsTable />}
		</Page.Content>
	</Page>;
}

export default IntegrationsPage;
