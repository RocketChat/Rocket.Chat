import { ContextualbarSkeleton } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import ContactInfoError from './ContactInfoError';
import EditContactInfo from './EditContactInfo';

type EditContactInfoWithDataProps = {
	id: string;
	onClose: () => void;
	onCancel: () => void;
};

const EditContactInfoWithData = ({ id, onClose, onCancel }: EditContactInfoWithDataProps) => {
	const getContactEndpoint = useEndpoint('GET', '/v1/omnichannel/contacts.get');
	const { data, isPending, isError } = useQuery({
		queryKey: ['getContactById', id],
		queryFn: async () => getContactEndpoint({ contactId: id }),
	});

	if (isPending) {
		return <ContextualbarSkeleton onClose={onClose} />;
	}

	if (isError) {
		return <ContactInfoError onClose={onClose} />;
	}

	return <EditContactInfo contactData={data.contact} onClose={onClose} onCancel={onCancel} />;
};

export default EditContactInfoWithData;
