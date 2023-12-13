import { Button } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { Page, PageHeader, PageContent } from '../../../components/Page';
import EmailInboxForm from './EmailInboxForm';
import EmailInboxFormWithData from './EmailInboxFormWithData';
import EmailInboxTable from './EmailInboxTable';

const EmailInboxPage = (): ReactElement => {
	const t = useTranslation();
	const id = useRouteParameter('_id');
	const context = useRouteParameter('context');
	const emailInboxRoute = useRoute('admin-email-inboxes');

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Email_Inboxes')}>
					{context && (
						<Button icon='back' onClick={(): void => emailInboxRoute.push({})}>
							{t('Back')}
						</Button>
					)}
					{!context && (
						<Button primary onClick={(): void => emailInboxRoute.push({ context: 'new' })}>
							{t('New_Email_Inbox')}
						</Button>
					)}
				</PageHeader>
				<PageContent>
					{!context && <EmailInboxTable />}
					{context === 'new' && <EmailInboxForm />}
					{context === 'edit' && id && <EmailInboxFormWithData id={id} />}
				</PageContent>
			</Page>
		</Page>
	);
};

export default EmailInboxPage;
