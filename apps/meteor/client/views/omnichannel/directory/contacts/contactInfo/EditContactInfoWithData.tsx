import { Box, ContextualbarContent } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { FormSkeleton } from '../../components/FormSkeleton';
import EditContactInfo from './EditContactInfo';

const EditContactInfoWithData = ({ id, onCancel }: { id: string; onCancel: () => void; onClose?: () => void }) => {
	const t = useTranslation();

	const getContactEndpoint = useEndpoint('GET', '/v1/omnichannel/contact');
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

	return <EditContactInfo id={id} data={data} onCancel={onCancel} />;
};

export default EditContactInfoWithData;
