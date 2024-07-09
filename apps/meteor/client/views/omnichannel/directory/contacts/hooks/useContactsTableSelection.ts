import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';

export const useContactsTableSelection = (contacts: ILivechatVisitor[]) => {
	const [selectedContacts, setSelectedContacts] = useState<{ [key: string]: ILivechatVisitor }>({});
	const selectedContactsLength = Object.values(selectedContacts).filter(Boolean).length;

	const checked = contacts.length === selectedContactsLength;
	const indeterminate = contacts.length && contacts.length > selectedContactsLength ? selectedContactsLength > 0 : false;

	const handleChangeContactSelection = useEffectEvent((contact: ILivechatVisitor) => {
		if (selectedContacts[contact._id]) {
			setSelectedContacts((deletedRooms) => {
				delete deletedRooms[contact._id];
				return { ...deletedRooms };
			});
			return;
		}
		setSelectedContacts((selectedContacts) => ({ ...selectedContacts, [contact._id]: contact }));
	});

	const handleToggleAllContacts = useEffectEvent(() => {
		if (Object.values(selectedContacts).filter(Boolean).length === 0) {
			return setSelectedContacts(Object.fromEntries(contacts.map((contact) => [contact._id, contact])));
		}
		setSelectedContacts({});
	});

	return {
		selectedContacts,
		selectedContactsLength,
		checked,
		indeterminate,
		setSelectedContacts,
		handleChangeContactSelection,
		handleToggleAllContacts,
	};
};
