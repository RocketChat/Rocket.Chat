import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import IntegrationsTable from './IntegrationsTable';
import NewBot from './NewBot';
import NewZapier from './NewZapier';
import { PageTabs } from '../../../components/PageTabs';

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
						variant='primary'
						onClick={() => router.navigate(`/admin/integrations/new/${context === 'webhook-outgoing' ? 'outgoing' : 'incoming'}`)}
					>
						{t('New')}
					</Button>
				</ButtonGroup>
			</PageHeader>
			<PageTabs
				items={[
					{ id: '', label: t('All') },
					{ id: 'webhook-incoming', label: t('Incoming') },
					{ id: 'webhook-outgoing', label: t('Outgoing') },
					{ id: 'zapier', label: t('Zapier') },
					{ id: 'bots', label: t('Bots') },
				]}
				selected={context ?? ''}
				onSelect={(context) => router.navigate(context ? `/admin/integrations/${context}` : '/admin/integrations')}
			/>
			<PageContent>
				{context === 'zapier' && <NewZapier />}
				{context === 'bots' && <NewBot />}
				{showTable && <IntegrationsTable type={context} />}
			</PageContent>
		</Page>
	);
};

export default IntegrationsPage;
