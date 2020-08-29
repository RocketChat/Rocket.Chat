import React from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../components/basic/Page';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import CustomFieldsTable from './CustomFieldsTable';

const CustomFieldsPage = () => {
	const t = useTranslation();

	const router = useRoute('omnichannel-customfields');

	const onAddNew = useMutableCallback(() => router.push({ context: 'new' }));

	return <Page>
		<Page.Header title={t('Custom_Fields')}>
			<Button small onClick={onAddNew}>
				<Icon name='plus' size='x16'/>
			</Button>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<CustomFieldsTable />
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default CustomFieldsPage;
