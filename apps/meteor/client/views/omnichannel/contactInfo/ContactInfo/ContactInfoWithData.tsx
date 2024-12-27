import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { ContextualbarSkeleton } from '../../../../components/Contextualbar';
import ContactInfoError from '../ContactInfoError';
import ContactInfo from './ContactInfo';

type ContactInfoWithDataProps = {
	id: string;
	onClose: () => void;
};

const ContactInfoWithData = ({ id: contactId, onClose }: ContactInfoWithDataProps) => {
	const canViewCustomFields = usePermission('view-livechat-room-customfields');

	const getContact = useEndpoint('GET', '/v1/omnichannel/contacts.get');
	const { data, isPending, isError } = useQuery({
		queryKey: ['getContactById', contactId],
		queryFn: () => getContact({ contactId }),
		enabled: canViewCustomFields && !!contactId,
	});

	if (isPending) {
		return <ContextualbarSkeleton />;
	}

	if (isError || !data?.contact) {
		return <ContactInfoError onClose={onClose} />;
	}

	return <ContactInfo contact={data?.contact} onClose={onClose} />;
};

export default ContactInfoWithData;
