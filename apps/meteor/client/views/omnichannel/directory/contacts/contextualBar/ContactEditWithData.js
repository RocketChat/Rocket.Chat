import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { FormSkeleton } from '../../Skeleton';
import ContactNewEdit from './ContactNewEdit';

function ContactEditWithData({ id, close }) {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`omnichannel/contact?contactId=${id}`); // TODO OMNICHANNEL

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (error || !data || !data.contact) {
		return <Box mbs='x16'>{t('Contact_not_found')}</Box>;
	}

	return <ContactNewEdit id={id} data={data} close={close} />;
}

export default ContactEditWithData;
