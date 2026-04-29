import { Button } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { ContextualbarDialog, Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import EditTrigger from './EditTrigger';
import EditTriggerWithData from './EditTriggerWithData';
import TriggersTable from './TriggersTable';

const TriggersPage = () => {
	const { t } = useTranslation();
	const id = useRouteParameter('id');
	const context = useRouteParameter('context');
	const router = useRouter();
	const handleClose = useEffectEvent(() => router.navigate('/omnichannel/triggers'));

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
					{context === 'edit' && id && <EditTriggerWithData triggerId={id} onClose={handleClose} />}
					{context === 'new' && <EditTrigger onClose={handleClose} />}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default TriggersPage;
