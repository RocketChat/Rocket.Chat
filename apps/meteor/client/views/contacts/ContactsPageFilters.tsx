import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useContactsSync } from './hooks/useContactsSync';
import FilterByText from '../../components/FilterByText';

export type ContactsPageFiltersProps = {
	onChangeText: (text: string) => void;
	onCreate?: () => void;
	placeholder: string;
	searchText: string;
	total: number;
};

const ContactsPageFilters = ({ onChangeText, onCreate, placeholder, searchText, total }: ContactsPageFiltersProps) => {
	const { t } = useTranslation();
	const syncContacts = useContactsSync();
	const isExchangeIntegrationEnabled = useSetting('Outlook_Calendar_Enabled', false);
	const isServerManaged = useSetting('Exchange_Mode', 'legacy') === 'server';
	const isContactSyncEnabled = useSetting('Exchange_Contacts_Sync_Enabled', false);
	const canSync = isExchangeIntegrationEnabled && isServerManaged && isContactSyncEnabled;

	return (
		<FilterByText placeholder={placeholder} value={searchText} onChange={(event) => onChangeText(event.currentTarget.value)}>
			{(canSync || onCreate) && (
				<ButtonGroup>
					{canSync && (
						<Button icon='reload' loading={syncContacts.isPending} onClick={() => syncContacts.mutate()}>
							{`${t('Sync')} (${total})`}
						</Button>
					)}
					{onCreate && (
						<Button icon='address-book-plus' onClick={onCreate}>
							{t('Create')}
						</Button>
					)}
				</ButtonGroup>
			)}
		</FilterByText>
	);
};

export default ContactsPageFilters;
