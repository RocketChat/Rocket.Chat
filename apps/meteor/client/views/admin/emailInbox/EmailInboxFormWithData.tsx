import type { IEmailInbox } from '@rocket.chat/core-typings';
import { States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import EmailInboxForm from './EmailInboxForm';

const EmailInboxFormWithData = ({ id }: { id: IEmailInbox['_id'] }): ReactElement => {
	const t = useTranslation();
	const getEmailInboxById = useEndpoint('GET', `/v1/email-inbox/${id}`);
	const { data, isLoading, error } = useQuery(['email-inbox/:_id'], () => getEmailInboxById());

	if (isLoading) {
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
