import { Button } from '@rocket.chat/fuselage';
import { useRouteParameter, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { Page, PageHeader, PageContent } from '../../../components/Page';
import CustomFieldsTable from './CustomFieldsTable';
import EditCustomFields from './EditCustomFields';
import EditCustomFieldsWithData from './EditCustomFieldsWithData';

const CustomFieldsPage = () => {
	const t = useTranslation();
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
			{context === 'edit' && id && <EditCustomFieldsWithData customFieldId={id} />}
			{context === 'new' && <EditCustomFields />}
		</Page>
	);
};

export default CustomFieldsPage;
