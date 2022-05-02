import { AutoComplete, Box, Option, Options, Chip, AutoCompleteProps } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import { useEndpointData } from '../../../hooks/useEndpointData';

type UsersInputProps = {
	value: unknown[];
	onChange: (value: unknown, action: 'remove' | undefined) => void;
};

type AutocompleteData = [AutoCompleteProps['options'], { [key: string]: string | undefined }];

const useUsersAutoComplete = (term: string): AutocompleteData => {
	const params = useMemo(
		() => ({
			selector: JSON.stringify({ term }),
		}),
		[term],
	);
	const { value: data } = useEndpointData('users.autocomplete', params);

	return useMemo<AutocompleteData>(() => {
		if (!data) {
			return [[], {}];
		}

		const options =
			data.items.map((user) => ({
				label: user.name ?? '',
				value: user._id ?? '',
			})) || [];

		const labelData = Object.fromEntries(data.items.map((user) => [user._id, user.username]) || []);

		return [options, labelData];
	}, [data]);
};

const UsersInput: FC<UsersInputProps> = ({ onChange, ...props }) => {
	const [filter, setFilter] = useState('');
	const [options, labelData] = useUsersAutoComplete(useDebouncedValue(filter, 1000));

	const onClickSelected = useCallback(
		(e) => {
			e.stopPropagation();
			e.preventDefault();
			onChange(e.currentTarget.value, 'remove');
		},
		[onChange],
	);

	const renderSelected = useCallback<FC<{ value?: string[] }>>(
		({ value: selected }) => (
			<>
				{selected?.map((value) => (
					<Chip key={value} {...props} height='x20' value={value} onClick={onClickSelected} mie='x4'>
						<UserAvatar size='x20' username={labelData[value] as string} />
						<Box is='span' margin='none' mis='x4'>
							{labelData[value]}
						</Box>
					</Chip>
				))}
			</>
		),
		[onClickSelected, props, labelData],
	);

	const renderItem = useCallback<FC<{ value: string }>>(
		({ value, ...props }) => (
			<Option key={value} {...props} avatar={<UserAvatar size={Options.AvatarSize} username={labelData[value] as string} />} />
		),
		[labelData],
	);

	return (
		<AutoComplete
			{...props}
			filter={filter}
			options={options}
			renderSelected={renderSelected}
			renderItem={renderItem}
			setFilter={setFilter}
			onChange={onChange}
		/>
	);
};

export default memo(UsersInput);
