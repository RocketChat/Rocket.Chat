import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import ContactEdit from './ContactEdit';
import ContactInfo from './ContactInfo';
import { contactsQueryKeys } from '../../lib/queryKeys';

export type ContactPanelRouterProps = {
	contactId?: string;
	context?: string;
	onOpenInfo: (contactId: string) => void;
	onOpenEdit: (contactId: string) => void;
	onClose: () => void;
};

const ContactPanelRouter = ({ contactId, context, onOpenInfo, onOpenEdit, onClose }: ContactPanelRouterProps) => {
	const getContact = useEndpoint('GET', '/v1/contacts.info');

	const isStored = Boolean(contactId) && contactId !== 'new';

	const { data, isError } = useQuery({
		queryKey: contactsQueryKeys.info(contactId ?? ''),
		queryFn: () => getContact({ contactId: contactId as string }),
		enabled: isStored,
	});

	useEffect(() => {
		if (isError) {
			onClose();
		}
	}, [isError, onClose]);

	if (contactId === 'new') {
		return <ContactEdit key={'new'} onSaved={({ _id }) => onOpenInfo(_id)} onClose={onClose} />;
	}

	if (!data) {
		return null;
	}

	if (context === 'edit') {
		return <ContactEdit key={data.contact._id} contact={data.contact} onSaved={({ _id }) => onOpenInfo(_id)} onClose={onClose} />;
	}

	return <ContactInfo contact={data.contact} onEdit={() => onOpenEdit(data.contact._id)} onClose={onClose} />;
};

export default ContactPanelRouter;
