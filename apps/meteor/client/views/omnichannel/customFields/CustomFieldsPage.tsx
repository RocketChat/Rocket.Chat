import { Button } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import CustomFieldsTable from './CustomFieldsTable';
import EditCustomFields from './EditCustomFields';
import EditCustomFieldsWithData from './EditCustomFieldsWithData';
import { ContextualbarDialog } from '../../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const CustomFieldsPage = () => {
	const { t } = useTranslation();
	const router = useRouter();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleCloseContextualbar = useEffectEvent(() => router.navigate('/omnichannel/customfields'));

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Custom_Fields')}>
					<Button data-qa-id='CustomFieldPageBtnNew' onClick={() => router.navigate('/omnichannel/customfields/new')}>
						{t('Create_custom_field')}
					</Button>
				</PageHeader>
				<PageContent>
					<CustomFieldsTable />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog onClose={handleCloseContextualbar}>
					{context === 'edit' && id && <EditCustomFieldsWithData customFieldId={id} onClose={handleCloseContextualbar} />}
					{context === 'new' && <EditCustomFields onClose={handleCloseContextualbar} />}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default CustomFieldsPage;
