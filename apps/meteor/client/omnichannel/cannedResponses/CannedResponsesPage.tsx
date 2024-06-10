import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useRouteParameter, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { Page, PageHeader, PageContent } from '../../components/Page';
import CannedResponseEdit from './CannedResponseEdit';
import CannedResponseEditWithData from './CannedResponseEditWithData';
import CannedResponsesTable from './CannedResponsesTable';

const CannedResponsesPage = () => {
	const t = useTranslation();
	const router = useRouter();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	if (context === 'edit' && id) {
		return <CannedResponseEditWithData cannedResponseId={id} />;
	}

	if (context === 'new') {
		return <CannedResponseEdit />;
	}

	return (
		<Page>
			<PageHeader title={t('Canned_Responses')}>
				<ButtonGroup>
					<Button onClick={() => router.navigate('/omnichannel/canned-responses/new')}>{t('Create_canned_response')}</Button>
				</ButtonGroup>
			</PageHeader>
			<PageContent>
				<CannedResponsesTable />
			</PageContent>
		</Page>
	);
};

export default CannedResponsesPage;
