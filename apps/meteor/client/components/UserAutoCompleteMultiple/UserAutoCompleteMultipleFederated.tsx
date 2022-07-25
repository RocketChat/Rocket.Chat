import { MultiSelectFiltered, Icon, Box, Chip } from '@rocket.chat/fuselage';
import type { Options } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, useState, ComponentProps } from 'react';
import { useQuery } from 'react-query';

import UserAvatar from '../avatar/UserAvatar';
import AutocompleteOptions, { OptionsContext } from './UserAutoCompleteMultipleOptions';

type UserAutoCompleteMultipleFederatedProps = {
	onChange: (value: Array<string>) => void;
	value: Array<string>;
	placeholder?: string;
};

export type UserAutoCompleteOptionType = {
	name: string;
	username: string;
	_federated?: boolean;
};

type UserAutoCompleteOptions = {
	[k: string]: UserAutoCompleteOptionType;
};

const matrixRegex = new RegExp('(.*:.*)');

const UserAutoCompleteMultipleFederated = ({
	onChange,
	value,
	placeholder,
	...props
}: UserAutoCompleteMultipleFederatedProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const [selectedCache, setSelectedCache] = useState<UserAutoCompleteOptions>({});

	const debouncedFilter = useDebouncedValue(filter, 500);
	const getUsers = useEndpoint('GET', '/v1/users.autocomplete');

	const { data } = useQuery(
		['users.autocomplete', debouncedFilter],
		async () => {
			const users = await getUsers({ selector: JSON.stringify({ term: debouncedFilter }) });
			const options = users.items.map((item): [string, UserAutoCompleteOptionType] => [item.username, item]);

			// Add extra option if filter text matches `username:server`
			// Used to add federated users that do not exist yet
			if (matrixRegex.test(debouncedFilter)) {
				options.unshift([debouncedFilter, { name: debouncedFilter, username: debouncedFilter, _federated: true }]);
			}

			return options;
		},
		{ keepPreviousData: true },
	);

	const options = data || [];

	const onAddSelected: ComponentProps<typeof Options>['onSelect'] = ([value]) => {
		setFilter('');
		const cachedOption = options.find(([curVal]) => curVal === value)?.[1];
		if (!cachedOption) {
			throw new Error('UserAutoCompleteMultiple - onAddSelected - failed to cache option');
		}
		setSelectedCache({ ...selectedCache, [value]: cachedOption });
	};

	return (
		<OptionsContext.Provider value={{ options, onSelect: onAddSelected }}>
			<MultiSelectFiltered
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				filter={filter}
				setFilter={setFilter}
				renderSelected={({ value, onMouseDown }: { value: string; onMouseDown: () => void }): ReactElement => {
					const currentCachedOption = selectedCache[value];

					return (
						<Chip key={value} {...props} height='x20' onMouseDown={onMouseDown} mie='x4' mb='x2'>
							{currentCachedOption._federated ? <Icon size='x20' name='globe' /> : <UserAvatar size='x20' username={value} />}
							<Box is='span' margin='none' mis='x4'>
								{currentCachedOption.name || currentCachedOption.username}
							</Box>
						</Chip>
					);
				}}
				renderOptions={AutocompleteOptions}
				options={options.concat(Object.entries(selectedCache)).map(([, item]) => [item.username, item.name || item.username])}
			/>
		</OptionsContext.Provider>
	);
};

export default memo(UserAutoCompleteMultipleFederated);
