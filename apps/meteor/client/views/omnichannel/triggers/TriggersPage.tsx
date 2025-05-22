import { Button } from '@rocket.chat/fuselage';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import EditTrigger from './EditTrigger';
import EditTriggerWithData from './EditTriggerWithData';
import TriggersTable from './TriggersTable';
import { ContextualbarDialog } from '../../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../components/Page';
import { useCallback } from 'react';

const TriggersPage = () => {
	const { t } = useTranslation();
	const id = useRouteParameter('id');
	const context = useRouteParameter('context');
	const router = useRouter();
	const handleClose = useCallback(() => router.navigate('/omnichannel/triggers'), [router]);

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Livechat_Triggers')}>
					<Button onClick={() => router.navigate('/omnichannel/triggers/new')}>{t('Create_trigger')}</Button>
				</PageHeader>
				<PageContent>
					<TriggersTable />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog onClose={handleClose}>
					{context === 'edit' && id && <EditTriggerWithData triggerId={id} />}
					{context === 'new' && <EditTrigger />}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default TriggersPage;
