import { Box, Button, ButtonGroup, Icon, TextInput } from '@rocket.chat/fuselage';
import { useCallback, useState } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useContactsSync } from './hooks/useContactsSync';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

export type ContactsPageFiltersProps = {
	onChangeText: (text: string) => void;
	onCreate: () => void;
	searchText: string;
	total: number;
};

export const useContactsPageFilters = () => {
	const [searchText, setSearchText] = useState('');

	const onChangeText = useCallback((text: string) => setSearchText(text), []);

	return { searchText, onChangeText };
};

const ContactsPageFilters = ({ onChangeText, onCreate, searchText, total }: ContactsPageFiltersProps) => {
	const { t } = useTranslation();
	const syncContacts = useContactsSync();
	const { data: licensed = false } = useHasLicenseModule('outlook-calendar');

	return (
		<Box
			is='form'
			onSubmit={useCallback((e: SubmitEvent<HTMLFormElement>) => e.preventDefault(), [])}
			marginBlock='x8'
			display='flex'
			flexWrap='wrap'
			alignItems='center'
			justifyContent='center'
		>
			<Box minWidth='x224' display='flex' margin='x4' flexGrow={1} flexShrink={0}>
				<TextInput
					name='search-contacts'
					alignItems='center'
					aria-label={t('Search_contacts')}
					placeholder={t('Search_contacts')}
					endAddon={<Icon name='magnifier' size='x20' />}
					onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeText(e.currentTarget.value)}
					value={searchText}
				/>
			</Box>
			<Box display='flex' margin='x4' alignItems='center'>
				<ButtonGroup>
					{licensed && (
						<Button icon='reload' loading={syncContacts.isPending} onClick={() => syncContacts.mutate()}>
							{`${t('Sync')} (${total})`}
						</Button>
					)}
					<Button icon='address-book-plus' onClick={onCreate}>
						{t('Create')}
					</Button>
				</ButtonGroup>
			</Box>
		</Box>
	);
};

export default ContactsPageFilters;
