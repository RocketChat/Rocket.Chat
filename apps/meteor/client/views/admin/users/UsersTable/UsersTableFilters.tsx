import type { IRole, Serialized } from '@rocket.chat/core-typings';
import { Select } from '@rocket.chat/fuselage';
import type { OptionProp } from '@rocket.chat/ui-client';
import { MultiSelectCustom } from '@rocket.chat/ui-client';
import type { ChangeEvent, Dispatch, Key, SetStateAction } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterBar, FilterBarFilters, FilterBarSearch } from '../../../../components/FilterBar';
import type { UsersFilters } from '../AdminUsersPage';

export type UsersTableFiltersProps = {
	setUsersFilters: Dispatch<SetStateAction<UsersFilters>>;
	roleData: { roles: Serialized<Omit<IRole, '_updatedAt'>>[] } | undefined;
	showStatusManagementFilter?: boolean;
};

const UsersTableFilters = ({ roleData, setUsersFilters, showStatusManagementFilter = false }: UsersTableFiltersProps) => {
	const { t } = useTranslation();

	const [selectedRoles, setSelectedRoles] = useState<OptionProp[]>([]);
	const [text, setText] = useState('');

	const [statusManagement, setStatusManagement] = useState<UsersFilters['statusManagement']>();

	const handleSearchTextChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setText(event.currentTarget.value);
			setUsersFilters({ text: event.currentTarget.value, roles: selectedRoles, statusManagement });
		},
		[selectedRoles, setUsersFilters, statusManagement],
	);

	const handleRolesChange = useCallback(
		(roles: OptionProp[]) => {
			setUsersFilters({ text, roles, statusManagement });
			setSelectedRoles(roles);
		},
		[setUsersFilters, statusManagement, text],
	);

	const handleStatusManagementChange = useCallback(
		(key: Key) => {
			const value = key === 'all' ? undefined : (key as UsersFilters['statusManagement']);
			setUsersFilters({ text, roles: selectedRoles, statusManagement: value });
			setStatusManagement(value);
		},
		[selectedRoles, setUsersFilters, text],
	);

	const statusManagementOptions: [key: string, label: string][] = [
		['all', t('All_user_statuses')],
		['default', t('Default_status')],
		['managed', t('Managed_status')],
	];

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
		<FilterBar>
			<FilterBarSearch placeholder={t('Search_Users')} onChange={handleSearchTextChange} value={text} />
			<FilterBarFilters>
				<MultiSelectCustom
					dropdownOptions={userRolesFilterStructure}
					defaultTitle='All_roles'
					selectedOptionsTitle='Roles'
					setSelectedOptions={handleRolesChange}
					selectedOptions={selectedRoles}
					searchBarText='Search_roles'
				/>
				{showStatusManagementFilter && (
					<Select
						aria-label={t('User_Status')}
						options={statusManagementOptions}
						value={statusManagement ?? 'all'}
						onChange={handleStatusManagementChange}
					/>
				)}
			</FilterBarFilters>
		</FilterBar>
	);
};

export default UsersTableFilters;
