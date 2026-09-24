import type { IRole, Serialized } from '@rocket.chat/core-typings';
import { Box, Icon, Margins, Select, TextInput } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { OptionProp } from '@rocket.chat/ui-client';
import { MultiSelectCustom } from '@rocket.chat/ui-client';
import type { ChangeEvent, Dispatch, Key, SetStateAction } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { UsersFilters } from '../AdminUsersPage';

export type UsersTableFiltersProps = {
	setUsersFilters: Dispatch<SetStateAction<UsersFilters>>;
	roleData: { roles: Serialized<IRole>[] } | undefined;
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

	const breakpoints = useBreakpoints();
	const isLargeScreenOrBigger = breakpoints.includes('lg');
	const fixFiltersSize = isLargeScreenOrBigger ? { maxWidth: 'x224', minWidth: 'x224' } : null;

	return (
		<Box
			marginBlock={16}
			is='form'
			onSubmit={(event) => {
				event.preventDefault();
			}}
			display='flex'
			flexWrap='wrap'
			alignItems='center'
		>
			<Margins inlineEnd={isLargeScreenOrBigger ? 16 : 0}>
				<TextInput
					placeholder={t('Search_Users')}
					endAddon={<Icon name='magnifier' size='x20' />}
					onChange={handleSearchTextChange}
					value={text}
					flexGrow={2}
					minWidth='x220'
					aria-label={t('Search_Users')}
				/>
			</Margins>
			<Box marginBlock={4} width={isLargeScreenOrBigger ? 'unset' : '100%'}>
				<MultiSelectCustom
					dropdownOptions={userRolesFilterStructure}
					defaultTitle='All_roles'
					selectedOptionsTitle='Roles'
					setSelectedOptions={handleRolesChange}
					selectedOptions={selectedRoles}
					searchBarText='Search_roles'
					{...fixFiltersSize}
				/>
			</Box>
			{showStatusManagementFilter && (
				<Box marginBlock={4} marginInlineStart={isLargeScreenOrBigger ? 16 : 0} width={isLargeScreenOrBigger ? 'unset' : '100%'}>
					<Select
						aria-label={t('User_Status')}
						options={statusManagementOptions}
						value={statusManagement ?? 'all'}
						onChange={handleStatusManagementChange}
						{...fixFiltersSize}
					/>
				</Box>
			)}
		</Box>
	);
};

export default UsersTableFilters;
