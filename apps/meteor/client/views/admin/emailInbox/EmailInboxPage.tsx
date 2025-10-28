import { Button } from '@rocket.chat/fuselage';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import EmailInboxForm from './EmailInboxForm';
import EmailInboxFormWithData from './EmailInboxFormWithData';
import EmailInboxTable from './EmailInboxTable';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const EmailInboxPage = (): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();

	const id = useRouteParameter('_id');
	const context = useRouteParameter('context');

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Email_Inboxes')} onClickBack={context ? () => router.navigate('/admin/email-inboxes') : undefined}>
					{!context && (
						<Button primary onClick={() => router.navigate('/admin/email-inboxes/new')}>
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
