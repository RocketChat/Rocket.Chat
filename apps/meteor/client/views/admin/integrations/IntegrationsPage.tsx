import { Button, ButtonGroup, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import IntegrationsTable from './IntegrationsTable';
import NewBot from './NewBot';
import NewZapier from './NewZapier';

const IntegrationsPage = () => {
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
				<TabsItem selected={!context} onClick={() => router.navigate('/admin/integrations')}>
					{t('All')}
				</TabsItem>
				<TabsItem selected={context === 'webhook-incoming'} onClick={() => router.navigate('/admin/integrations/webhook-incoming')}>
					{t('Incoming')}
				</TabsItem>
				<TabsItem selected={context === 'webhook-outgoing'} onClick={() => router.navigate('/admin/integrations/webhook-outgoing')}>
					{t('Outgoing')}
				</TabsItem>
				<TabsItem selected={context === 'zapier'} onClick={() => router.navigate('/admin/integrations/zapier')}>
					{t('Zapier')}
				</TabsItem>
				<TabsItem selected={context === 'bots'} onClick={() => router.navigate('/admin/integrations/bots')}>
					{t('Bots')}
				</TabsItem>
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
