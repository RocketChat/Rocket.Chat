import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import Page from '../../../../client/components/Page';
import CannedResponseEdit from './CannedResponseEdit';
import CannedResponseEditWithData from './CannedResponseEditWithData';
import CannedResponsesTable from './CannedResponsesTable';

const CannedResponsesPage = () => {
	const t = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const reload = useMutableCallback(() => queryClient.invalidateQueries(['canned-responses']));

	if (context === 'edit' && id) {
		return <CannedResponseEditWithData reload={reload} totalDataReload={reload} cannedResponseId={id} />;
	}

	if (context === 'new') {
		return <CannedResponseEdit reload={reload} totalDataReload={reload} />;
	}

	return (
		<Page>
			<Page.Header title={t('Canned_Responses')}>
				<ButtonGroup>
					<Button onClick={() => router.navigate('/omnichannel/canned-responses/new')}>{t('Create_canned_response')}</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<CannedResponsesTable />
			</Page.Content>
		</Page>
	);
};

export default CannedResponsesPage;
