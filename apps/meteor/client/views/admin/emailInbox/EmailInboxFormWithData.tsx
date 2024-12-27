import type { IEmailInbox } from '@rocket.chat/core-typings';
import { States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import EmailInboxForm from './EmailInboxForm';
import { FormSkeleton } from '../../../components/Skeleton';

const EmailInboxFormWithData = ({ id }: { id: IEmailInbox['_id'] }): ReactElement => {
	const t = useTranslation();
	const getEmailInboxById = useEndpoint('GET', '/v1/email-inbox/:_id', { _id: id });
	const { data, isPending, error } = useQuery({
		queryKey: ['email-inbox', id],
		queryFn: () => getEmailInboxById(),
	});

	if (isPending) {
		return <FormSkeleton />;
	}

	if (error || !data) {
		return (
			<States>
				<StatesIcon name='circle-exclamation' variation='danger' />
				<StatesTitle>{t('error-email-inbox-not-found')}</StatesTitle>
			</States>
		);
	}

	return <EmailInboxForm inboxData={data} />;
};

export default EmailInboxFormWithData;
