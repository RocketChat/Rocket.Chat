import React, { useCallback } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';

import Page from '../../components/basic/Page';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import CustomFieldsTable from './CustomFieldsTable';

const CustomFieldsPage = () => {
	const t = useTranslation();

	const router = useRoute('omnichannel-customfields');

	const onAddNew = useCallback(() => router.push({ context: 'new' }), [router]);

	return <Page>
		<Page.Header title={t('Custom_Fields')}>
			<Button onClick={onAddNew}>
				<Icon name='plus' size='x16'/>
				{t('Add')}
			</Button>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<CustomFieldsTable />
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default CustomFieldsPage;
