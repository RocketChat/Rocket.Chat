import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import type { OptionProp } from '@rocket.chat/ui-client';
import { MultiSelectCustom } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useEffect, useState } from 'react';
import type { Dispatch, ReactElement, SetStateAction } from 'react';

const inviteStatusFilterStructure = [
	{
		id: 'filter_by_invite_status',
		text: 'Filter_by_invite_status',
		isGroupTitle: true,
	},
	{
		id: 'pending',
		text: 'Pending',
		checked: false,
	},
	{
		id: 'accepted',
		text: 'Accepted',
		checked: false,
	},
	{
		id: 'expired',
		text: 'Expired',
		checked: false,
	},
] as OptionProp[];

const inviteTypesFilterStructure = [
	{
		id: 'filter_by_invite_type',
		text: 'Filter_by_invite_type',
		isGroupTitle: true,
	},
	{
		id: 'email',
		text: 'Email',
		checked: false,
	},
	{
		id: 'invite_link',
		text: 'Invite link',
		checked: false,
	},
] as OptionProp[];

const UsersInviteTableFilters = ({ setFilters }: { setFilters: Dispatch<SetStateAction<any>> }): ReactElement => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const [inviteStatusOptions, setinviteStatusOptions] = useState<OptionProp[]>(inviteStatusFilterStructure);
	const [inviteTypesOptions, setinviteTypesOptions] = useState<OptionProp[]>(inviteTypesFilterStructure);
	const [inviteStatusSelectedOptions, setinviteStatusSelectedOptions] = useState<OptionProp[]>([]);
	const [inviteTypesSelectedOptions, setinviteTypesSelectedOptions] = useState<OptionProp[]>([]);

	useEffect(() => {
		return setFilters({ searchText: text, types: inviteStatusSelectedOptions, visibility: inviteTypesSelectedOptions });
	}, [setFilters, inviteStatusSelectedOptions, inviteTypesSelectedOptions, text]);

	const handleSearchTextChange = useCallback((event) => setText(event.currentTarget.value), []);

	return (
		<Box
			is='form'
			onSubmit={useCallback((e) => e.preventDefault(), [])}
			mb='x8'
			display='flex'
			flexWrap='wrap'
			alignItems='center'
			justifyContent='center'
		>
			<Box minWidth='x224' display='flex' m='x4' flexGrow={2}>
				<TextInput
					alignItems='center'
					placeholder={t('Search')}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={handleSearchTextChange}
					value={text}
				/>
			</Box>
			<Box minWidth='x224' m='x4'>
				<MultiSelectCustom
					dropdownOptions={inviteStatusOptions}
					defaultTitle='All_invite_status'
					selectedOptionsTitle='Status' // TODO: check with Design if this name is ok
					setSelectedOptions={setinviteStatusSelectedOptions}
					selectedOptions={inviteStatusSelectedOptions}
					customSetSelected={setinviteStatusOptions}
				/>
			</Box>

			<Box minWidth='x224' m='x4'>
				<MultiSelectCustom
					dropdownOptions={inviteTypesOptions}
					defaultTitle='All_invite_types'
					selectedOptionsTitle='Invite_types'
					setSelectedOptions={setinviteTypesSelectedOptions}
					selectedOptions={inviteTypesSelectedOptions}
					customSetSelected={setinviteTypesOptions}
				/>
			</Box>
		</Box>
	);
};

export default UsersInviteTableFilters;
