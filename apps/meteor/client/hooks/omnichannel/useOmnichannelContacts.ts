import { useContext } from 'react';

import { ContactsContext, ContactsContextValue } from '../../providers/OmnichannelContactsProvider';

export const useOmnichannelContacts = (): ContactsContextValue => useContext(ContactsContext);
