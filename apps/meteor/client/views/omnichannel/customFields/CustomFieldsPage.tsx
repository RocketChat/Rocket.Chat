import { Button } from '@rocket.chat/fuselage';
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
				<ContextualbarDialog>
					{context === 'edit' && id && <EditCustomFieldsWithData customFieldId={id} />}
					{context === 'new' && <EditCustomFields />}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default CustomFieldsPage;
