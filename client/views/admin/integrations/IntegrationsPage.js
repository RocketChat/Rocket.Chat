import { Button, ButtonGroup, Icon, Tabs } from '@rocket.chat/fuselage';
import React, { useEffect, useCallback } from 'react';

import Page from '../../../components/Page';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import IntegrationsTable from './IntegrationsTable';
import NewZapier from './new/NewZapier';
import NewBot from './new/NewBot';

function IntegrationsPage() {
	const t = useTranslation();

	const router = useRoute('admin-integrations');

	const handleNewButtonClick = useCallback(() => {
		router.push({ context: 'new', type: 'incoming' });
	}, [router]);

	const context = useRouteParameter('context');
	useEffect(() => {
		if (!context) {
			router.push({ context: 'webhook-incoming' });
		}
	}, [context, router]);

	const showTable = !['zapier', 'bots'].includes(context);

	const goToIncoming = useCallback(() => router.push({ context: 'webhook-incoming' }), [router]);
	const goToOutgoing = useCallback(() => router.push({ context: 'webhook-outgoing' }), [router]);
	const goToZapier = useCallback(() => router.push({ context: 'zapier' }), [router]);
	const goToBots = useCallback(() => router.push({ context: 'bots' }), [router]);

	return <Page flexDirection='column'>
		<Page.Header title={t('Integrations')}>
			<ButtonGroup>
				<Button onClick={handleNewButtonClick}>
					<Icon name='plus'/> {t('New')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Tabs>
			<Tabs.Item selected={context === 'webhook-incoming'} onClick={goToIncoming}>{t('Incoming')}</Tabs.Item>
			<Tabs.Item selected={context === 'webhook-outgoing'} onClick={goToOutgoing}>{t('Outgoing')}</Tabs.Item>
			<Tabs.Item selected={context === 'zapier'} onClick={goToZapier}>{t('Zapier')}</Tabs.Item>
			<Tabs.Item selected={context === 'bots'} onClick={goToBots}>{t('Bots')}</Tabs.Item>
		</Tabs>
		<Page.Content>
			{context === 'zapier' && <NewZapier />}
			{context === 'bots' && <NewBot />}
			{showTable && <IntegrationsTable type={context}/>}
		</Page.Content>
	</Page>;
}

export default IntegrationsPage;
