import { Button, ButtonGroup, Tabs } from '@rocket.chat/fuselage';
import { useRouteParameter, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../components/Page';
import IntegrationsTable from './IntegrationsTable';
import NewBot from './NewBot';
import NewZapier from './NewZapier';

const IntegrationsPage = (): ReactElement => {
	const t = useTranslation();
	const router = useRouter();
	const context = useRouteParameter('context');

	const showTable = !['zapier', 'bots'].includes(context || '');

	return (
		<Page flexDirection='column'>
			<Page.Header title={t('Integrations')}>
				<ButtonGroup>
					<Button
						primary
						onClick={() => router.navigate(`/admin/integrations/new/${context === 'webhook-outgoing' ? 'outgoing' : 'incoming'}`)}
					>
						{t('New')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Tabs>
				<Tabs.Item selected={!context} onClick={() => router.navigate('/admin/integrations')}>
					{t('All')}
				</Tabs.Item>
				<Tabs.Item selected={context === 'webhook-incoming'} onClick={() => router.navigate('/admin/integrations/webhook-incoming')}>
					{t('Incoming')}
				</Tabs.Item>
				<Tabs.Item selected={context === 'webhook-outgoing'} onClick={() => router.navigate('/admin/integrations/webhook-outgoing')}>
					{t('Outgoing')}
				</Tabs.Item>
				<Tabs.Item selected={context === 'zapier'} onClick={() => router.navigate('/admin/integrations/zapier')}>
					{t('Zapier')}
				</Tabs.Item>
				<Tabs.Item selected={context === 'bots'} onClick={() => router.navigate('/admin/integrations/bots')}>
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
