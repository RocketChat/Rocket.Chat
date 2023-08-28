import { Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { MutableRefObject } from 'react';
import React from 'react';

import Page from '../../../components/Page';
import CustomFieldsTable from './CustomFieldsTable';

const CustomFieldsPage = ({ reload }: { reload: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const router = useRoute('omnichannel-customfields');

	const onAddNew = useMutableCallback(() => router.push({ context: 'new' }));

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Custom_Fields')}>
					<Button data-qa-id='CustomFieldPageBtnNew' onClick={onAddNew}>
						{t('Create_custom_field')}
					</Button>
				</Page.Header>
				<Page.Content>
					<CustomFieldsTable reload={reload} />
				</Page.Content>
			</Page>
		</Page>
	);
};

export default CustomFieldsPage;
