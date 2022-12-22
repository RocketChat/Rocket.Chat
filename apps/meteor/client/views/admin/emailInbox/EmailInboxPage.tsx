import { Button, Icon } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../components/Page';
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
				<Page.Header title={t('Email_Inboxes')}>
					{context && (
						<Button onClick={(): void => emailInboxRoute.push({})}>
							<Icon name='back' />
							{t('Back')}
						</Button>
					)}
					{!context && (
						<Button primary onClick={(): void => emailInboxRoute.push({ context: 'new' })}>
							<Icon name='plus' /> {t('New_Email_Inbox')}
						</Button>
					)}
				</Page.Header>
				<Page.Content>
					{!context && <EmailInboxTable />}
					{context === 'new' && <EmailInboxForm />}
					{context === 'edit' && id && <EmailInboxFormWithData id={id} />}
				</Page.Content>
			</Page>
		</Page>
	);
};

export default EmailInboxPage;
