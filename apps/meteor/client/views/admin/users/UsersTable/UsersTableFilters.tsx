import type { IRole } from '@rocket.chat/core-typings';
import { Box, Icon, Margins, TextInput } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { OptionProp } from '@rocket.chat/ui-client';
import { MultiSelectCustom } from '@rocket.chat/ui-client';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { UsersFilters } from '../AdminUsersPage';

type UsersTableFiltersProps = {
	setUsersFilters: Dispatch<SetStateAction<UsersFilters>>;
	roleData: { roles: IRole[] } | undefined;
};

const UsersTableFilters = ({ roleData, setUsersFilters }: UsersTableFiltersProps) => {
	const { t } = useTranslation();

	const [selectedRoles, setSelectedRoles] = useState<OptionProp[]>([]);
	const [text, setText] = useState('');

	const handleSearchTextChange = useCallback(
		(event: FormEvent<HTMLInputElement>) => {
			setText(event.currentTarget.value);
			setUsersFilters({ text: event.currentTarget.value, roles: selectedRoles });
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

	const breakpoints = useBreakpoints();
	const isLargeScreenOrBigger = breakpoints.includes('lg');
	const fixFiltersSize = isLargeScreenOrBigger ? { maxWidth: 'x224', minWidth: 'x224' } : null;

	return (
		<Box
			mb={16}
			is='form'
			onSubmit={(event: FormEvent<HTMLFormElement>) => {
				event.preventDefault();
			}}
			display='flex'
			flexWrap='wrap'
			alignItems='center'
		>
			<Margins inlineEnd={isLargeScreenOrBigger ? 16 : 0}>
				<TextInput
					placeholder={t('Search_Users')}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={handleSearchTextChange}
					value={text}
					flexGrow={2}
					minWidth='x220'
					aria-label={t('Search_Users')}
				/>
			</Margins>
			<Box mb={4} width={isLargeScreenOrBigger ? 'unset' : '100%'}>
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
		</Box>
	);
};

export default UsersTableFilters;
