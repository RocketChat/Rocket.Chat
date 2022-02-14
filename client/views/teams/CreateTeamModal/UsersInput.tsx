import { Box, Option, Options, Chip, MultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { ComponentProps, FC, memo, useCallback, useMemo, useState } from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import { useEndpointData } from '../../../hooks/useEndpointData';

type UsersInputProps = {
	value: unknown[];
	onChange?: (value: unknown, action: 'remove' | undefined) => void;
};

type AutocompleteData = [ComponentProps<typeof MultiSelectFiltered>['options'], { [key: string]: string | undefined }];

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

		const options = data.items.map((user) => [user._id ?? '', user.name ?? '']) || [];

		const labelData = Object.fromEntries(data.items.map((user) => [user._id, user.username]) || []);

		return [options, labelData];
	}, [data]);
};

const UsersInput: FC<UsersInputProps> = (props) => {
	const [filter, setFilter] = useState('');
	const [options, labelData] = useUsersAutoComplete(useDebouncedValue(filter, 1000));

	const renderSelected: FC<{ value: string; onMouseDown: () => void }> = ({ value, onMouseDown }) => (
		<>
			<Chip {...props} height='x20' value={value} onClick={onMouseDown} mie='x4'>
				<UserAvatar size='x20' username={labelData[value] as string} />
				<Box is='span' margin='none' mis='x4'>
					{labelData[value]}
				</Box>
			</Chip>
		</>
	);
	const renderItem = useCallback<FC<{ value: string }>>(
		({ value, ...props }) => (
			<Option key={value} {...props} avatar={<UserAvatar size={Options.AvatarSize} username={labelData[value] as string} />} />
		),
		[labelData],
	);

	return (
		<MultiSelectFiltered options={options} renderItem={renderItem} filter={filter} setFilter={setFilter} renderSelected={renderSelected} />
	);
};

export default memo(UsersInput);
