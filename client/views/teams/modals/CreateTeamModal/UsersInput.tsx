import { AutoComplete, Box, Option, Options, Chip, AutoCompleteProps } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { IUser } from '../../../../../definition/IUser';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useEndpointData } from '../../../../hooks/useEndpointData';

type UsersInputProps = {
	value: unknown[];
	onChange: (value: unknown, action: 'remove' | undefined) => void;
};

type UsersAutoCompleteEndpoint = {
	params: {
		selector: string;
	};
	value: {
		items: IUser[];
	};
};

const useUsersAutoComplete = (term: string): AutoCompleteProps['options'] => {
	const params = useMemo<UsersAutoCompleteEndpoint['params']>(() => ({
		selector: JSON.stringify({ term }),
	}), [term]);
	const { value: data } = useEndpointData<UsersAutoCompleteEndpoint['value']>('users.autocomplete', params);

	return useMemo<AutoCompleteProps['options']>(() => {
		if (!data) {
			return [];
		}

		return data.items.map((user) => ({
			label: user.name ?? '',
			value: user.username ?? '',
		})) || [];
	}, [data]);
};

const UsersInput: FC<UsersInputProps> = ({ onChange, ...props }) => {
	const [filter, setFilter] = useState('');
	const options = useUsersAutoComplete(useDebouncedValue(filter, 1000));

	const onClickSelected = useCallback((e) => {
		e.stopPropagation();
		e.preventDefault();
		onChange(e.currentTarget.value, 'remove');
	}, [onChange]);

	const renderSelected = useCallback<FC<{ value?: string[] }>>(
		({ value: selected }) => <>
			{selected?.map((value) => <Chip key={value} {...props} height='x20' value={value} onClick={onClickSelected} mie='x4'>
				<UserAvatar size='x20' username={value} />
				<Box is='span' margin='none' mis='x4'>{value}</Box>
			</Chip>)}
		</>,
		[onClickSelected, props],
	);

	const renderItem = useCallback<FC<{ value: string }>>(
		({ value, ...props }) =>
			<Option key={value} {...props} avatar={<UserAvatar size={Options.AvatarSize} username={value} />} />,
		[],
	);

	return <AutoComplete
		{...props}
		filter={filter}
		options={options}
		renderSelected={renderSelected}
		renderItem={renderItem}
		setFilter={setFilter}
		onChange={onChange}
	/>;
};

export default memo(UsersInput);
