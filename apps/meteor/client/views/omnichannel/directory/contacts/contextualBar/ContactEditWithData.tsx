import { Box, ContextualbarContent } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { FormSkeleton } from '../../components/FormSkeleton';
import ContactNewEdit from './ContactNewEdit';

type ContactEditWithDataProps = {
	id: string;
	close: () => void;
};

function ContactEditWithData({ id, close }: ContactEditWithDataProps) {
	const { t } = useTranslation();
	const {
		value: data,
		phase: state,
		error,
	} = useEndpointData('/v1/omnichannel/contact', { params: useMemo(() => ({ contactId: id }), [id]) });

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return (
			<ContextualbarContent>
				<FormSkeleton />
			</ContextualbarContent>
		);
	}

	if (error || !data || !data.contact) {
		return <Box mbs={16}>{t('Contact_not_found')}</Box>;
	}

	return <ContactNewEdit id={id} data={data} close={close} />;
}

export default ContactEditWithData;
