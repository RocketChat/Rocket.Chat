import React from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';

import Page from '../../../components/Page';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import EmailInboxTable from './EmailInboxTable';
import EmailInboxForm, { EmailInboxEditWithData } from './EmailInboxForm';


export function EmailInboxPage() {
	const t = useTranslation();

	const context = useRouteParameter('context');
	const id = useRouteParameter('_id');

	const emailInboxRoute = useRoute('admin-email-inboxes');

	const handleNewButtonClick = () => {
		emailInboxRoute.push({ context: 'new' });
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Email_Inboxes')}>
				{context && <Button alignSelf='flex-end' onClick={() => emailInboxRoute.push({})}>
					<Icon name='back'/>{t('Back')}
				</Button>}
				{!context && <Button primary onClick={handleNewButtonClick}>
					<Icon name='plus'/> {t('New_Email_Inbox')}
				</Button>}
			</Page.Header>
			<Page.Content>
				{!context && <EmailInboxTable />}
				{context === 'new' && <EmailInboxForm />}
				{context === 'edit' && <EmailInboxEditWithData id={id} />}
			</Page.Content>
		</Page>
	</Page>;
}

export default EmailInboxPage;
