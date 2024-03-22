import type { IRole } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import type { OptionProp } from '@rocket.chat/ui-client';
import { MultiSelectCustom } from '@rocket.chat/ui-client';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { UsersFilters } from '../AdminUsersPage';

type UsersTableFiltersProps = {
	setUsersFilters: React.Dispatch<React.SetStateAction<UsersFilters>>;
	roleData: { roles: IRole[] } | undefined;
};

const UsersTableFilters = ({ roleData, setUsersFilters }: UsersTableFiltersProps) => {
	const { t } = useTranslation();

	const [selectedRoles, setSelectedRoles] = useState<OptionProp[]>([]);
	const [text, setText] = useState('');

	const handleSearchTextChange = useCallback(
		(event) => {
			const text = event.currentTarget.value;
			setUsersFilters({ text, roles: selectedRoles });
			setText(text);
		},
		[selectedRoles, setUsersFilters],
	);

	const handleRolesChange = useCallback(
		(roles: OptionProp[]) => {
			setUsersFilters({ text, roles });
			setSelectedRoles(roles);
		},
		[setUsersFilters, text],
	);

	const userRolesFilterStructure = useMemo(
		() => [
			{
				id: 'filter_by_role',
				text: 'Filter_by_role',
			},
			{
				id: 'all',
				text: 'All_roles',
				checked: false,
			},
			...(roleData
				? roleData.roles.map((role) => ({
						id: role._id,
						text: role.description || role.name || role._id,
						checked: false,
				  }))
				: []),
		],
		[roleData],
	);

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
					name='Search_Users'
					alignItems='center'
					placeholder={t('Search_Users')}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={handleSearchTextChange}
					value={text}
				/>
			</Box>
			<Box minWidth='x224' m='x4'>
				<MultiSelectCustom
					dropdownOptions={userRolesFilterStructure}
					defaultTitle='All_roles'
					selectedOptionsTitle='Roles'
					setSelectedOptions={handleRolesChange}
					selectedOptions={selectedRoles}
					searchBarText='Search_roles'
				/>
			</Box>
		</Box>
	);
};

export default UsersTableFilters;
