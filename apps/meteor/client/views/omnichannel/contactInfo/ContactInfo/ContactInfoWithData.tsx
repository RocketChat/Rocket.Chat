import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { ContextualbarSkeleton } from '../../../../components/Contextualbar';
import ContactInfo from './ContactInfo';

type ContactInfoWithDataProps = {
	id: string;
	onClose: () => void;
};

const ContactInfoWithData = ({ id: contactId, onClose }: ContactInfoWithDataProps) => {
	const t = useTranslation();
	const canViewCustomFields = usePermission('view-livechat-room-customfields');

	const getContact = useEndpoint('GET', '/v1/omnichannel/contacts.get');
	const { data, isLoading, isError } = useQuery(['getContactById', contactId], () => getContact({ contactId }), {
		enabled: canViewCustomFields && !!contactId,
	});

	if (isLoading) {
		return <ContextualbarSkeleton />;
	}

	if (isError || !data?.contact) {
		return <Box mbs={16}>{t('Contact_not_found')}</Box>;
	}

	return <ContactInfo contact={data?.contact} onClose={onClose} />;
};

export default ContactInfoWithData;
