import { Button, ButtonGroup, Tabs } from '@rocket.chat/fuselage';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import IntegrationsTable from './IntegrationsTable';
import NewBot from './NewBot';
import NewZapier from './NewZapier';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const IntegrationsPage = (): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const context = useRouteParameter('context');

	const showTable = !['zapier', 'bots'].includes(context || '');

	return (
		<Page flexDirection='column'>
			<PageHeader title={t('Integrations')}>
				<ButtonGroup>
					<Button
						primary
						onClick={() => router.navigate(`/admin/integrations/new/${context === 'webhook-outgoing' ? 'outgoing' : 'incoming'}`)}
					>
						{t('New')}
					</Button>
				</ButtonGroup>
			</PageHeader>
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
			<PageContent>
				{context === 'zapier' && <NewZapier />}
				{context === 'bots' && <NewBot />}
				{showTable && <IntegrationsTable type={context} />}
			</PageContent>
		</Page>
	);
};

export default IntegrationsPage;
