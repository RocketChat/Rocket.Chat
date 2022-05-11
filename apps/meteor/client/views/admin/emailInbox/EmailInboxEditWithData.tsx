import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EmailInboxForm from './EmailInboxForm';
import { FormSkeleton } from './Skeleton';

type EmailInboxEditWithDataProps = {
	id: string;
};

const EmailInboxEditWithData = ({ id }: EmailInboxEditWithDataProps): ReactElement => {
	const t = useTranslation();
	const { value: data, error, phase: state } = useEndpointData(`email-inbox/${id}`);

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (error || !data) {
		return <Box mbs='x16'>{t('error-email-inbox-not-found')}</Box>;
	}

	return <EmailInboxForm id={id} data={data} />;
};

export default EmailInboxEditWithData;
