import { Button, ButtonGroup, Icon, Tabs } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import Page from '../../../components/Page';
import IntegrationsTable from './IntegrationsTable';
import NewBot from './new/NewBot';
import NewZapier from './new/NewZapier';

const IntegrationsPage = (): ReactElement => {
	const t = useTranslation();
	const router = useRoute('admin-integrations');
	const context = useRouteParameter('context');
	const showTable = !['zapier', 'bots'].includes(context || '');

	const handleNewButtonClick = useCallback(() => {
		router.push({ context: 'new', type: 'incoming' });
	}, [router]);

	const goToAll = useCallback(() => router.push({ context: '' }), [router]);
	const goToIncoming = useCallback(() => router.push({ context: 'webhook-incoming' }), [router]);
	const goToOutgoing = useCallback(() => router.push({ context: 'webhook-outgoing' }), [router]);
	const goToZapier = useCallback(() => router.push({ context: 'zapier' }), [router]);
	const goToBots = useCallback(() => router.push({ context: 'bots' }), [router]);

	return (
		<Page flexDirection='column'>
			<Page.Header title={t('Integrations')}>
				<ButtonGroup>
					<Button primary onClick={handleNewButtonClick}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Tabs>
				<Tabs.Item selected={!context} onClick={goToAll}>
					{t('All')}
				</Tabs.Item>
				<Tabs.Item selected={context === 'webhook-incoming'} onClick={goToIncoming}>
					{t('Incoming')}
				</Tabs.Item>
				<Tabs.Item selected={context === 'webhook-outgoing'} onClick={goToOutgoing}>
					{t('Outgoing')}
				</Tabs.Item>
				<Tabs.Item selected={context === 'zapier'} onClick={goToZapier}>
					{t('Zapier')}
				</Tabs.Item>
				<Tabs.Item selected={context === 'bots'} onClick={goToBots}>
					{t('Bots')}
				</Tabs.Item>
			</Tabs>
			<Page.Content>
				{context === 'zapier' && <NewZapier />}
				{context === 'bots' && <NewBot />}
				{showTable && <IntegrationsTable type={context} />}
			</Page.Content>
		</Page>
	);
};

export default IntegrationsPage;
