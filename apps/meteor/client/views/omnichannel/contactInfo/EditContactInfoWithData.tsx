import { Box, ContextualbarContent } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { FormSkeleton } from '../directory/components/FormSkeleton';
import EditContactInfo from './EditContactInfo';

type EditContactInfoWithDataProps = {
	id: string;
	onClose: () => void;
	onCancel: () => void;
};

const EditContactInfoWithData = ({ id, onClose, onCancel }: EditContactInfoWithDataProps) => {
	const t = useTranslation();

	const getContactEndpoint = useEndpoint('GET', '/v1/omnichannel/contacts.get');
	const { data, isLoading, isError } = useQuery(['getContactById', id], async () => getContactEndpoint({ contactId: id }));

	if (isLoading) {
		return (
			<ContextualbarContent>
				<FormSkeleton />
			</ContextualbarContent>
		);
	}

	if (isError) {
		return <Box mbs={16}>{t('Contact_not_found')}</Box>;
	}

	return <EditContactInfo contactData={data.contact} onClose={onClose} onCancel={onCancel} />;
};

export default EditContactInfoWithData;
