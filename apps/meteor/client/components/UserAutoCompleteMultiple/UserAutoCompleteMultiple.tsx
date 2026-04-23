import { MultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReactElement, AllHTMLAttributes } from 'react';
import { memo, useState, useCallback, useMemo } from 'react';

import AutocompleteOptions, { OptionsContext } from './UserAutoCompleteMultipleOptions';
import UserAvatarChip from './UserAvatarChip';
import { usersQueryKeys } from '../../lib/queryKeys';

type UserAutoCompleteMultipleProps = {
	onChange: (value: Array<string>) => void;
	value: Array<string> | undefined;
	placeholder?: string;
	federated?: boolean;
	error?: string;
} & Omit<AllHTMLAttributes<HTMLInputElement>, 'is' | 'onChange' | 'value'>;

type UserAutoCompleteOptionType = {
	name: string;
	username: string;
	_federated?: boolean;
};

type UserAutoCompleteOptions = {
	[k: string]: UserAutoCompleteOptionType;
};

const matrixRegex = new RegExp('@(.*:.*)');

const UserAutoCompleteMultiple = ({ onChange, value, placeholder, federated, ...props }: UserAutoCompleteMultipleProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const [selectedCache, setSelectedCache] = useState<UserAutoCompleteOptions>({});

	const debouncedFilter = useDebouncedValue(filter, 500);
	const getUsers = useEndpoint('GET', '/v1/users.autocomplete');

	const { data } = useQuery({
		queryKey: usersQueryKeys.userAutoComplete(debouncedFilter, federated ?? false),

		queryFn: async () => {
			const users = await getUsers({ selector: JSON.stringify({ term: debouncedFilter }) });
			const options = users.items.map((item): [string, UserAutoCompleteOptionType] => [item.username, item]);

			// Add extra option if filter text matches `username:server`
			// Used to add federated users that do not exist yet
			if (federated && matrixRegex.test(debouncedFilter)) {
				options.unshift([debouncedFilter, { name: debouncedFilter, username: debouncedFilter, _federated: true }]);
			}

			return options;
		},

		placeholderData: keepPreviousData,
	});

	const options = useMemo(() => data || [], [data]);

	const onAddUser = useCallback(
		(username: string): void => {
			const user = options?.find(([val]) => val === username)?.[1];
			if (!user) {
				throw new Error('UserAutoCompleteMultiple - onAddSelected - failed to cache option');
			}
			setSelectedCache((selectedCache) => ({ ...selectedCache, [username]: user }));
		},
		[setSelectedCache, options],
	);

	const onRemoveUser = useCallback(
		(username: string): void =>
			setSelectedCache((selectedCache) => {
				const users = { ...selectedCache };
				delete users[username];
				return users;
			}),
		[setSelectedCache],
	);

	const handleOnChange = useCallback(
		(usernames: string[]) => {
			onChange(usernames);
			const newAddedUsername = usernames.filter((username) => !value?.includes(username))[0];
			const removedUsername = value?.filter((username) => !usernames.includes(username))[0];
			setFilter('');
			newAddedUsername && onAddUser(newAddedUsername);
			removedUsername && onRemoveUser(removedUsername);
		},
		[onChange, setFilter, onAddUser, onRemoveUser, value],
	);

	return (
		<OptionsContext.Provider value={{ options }}>
			<MultiSelectFiltered
				{...props}
				placeholder={placeholder}
				value={value}
				onChange={handleOnChange}
				filter={filter}
				setFilter={setFilter}
				renderSelected={({ value: username, onMouseDown }: { value: string; onMouseDown: () => void }) => {
					const currentCachedOption = selectedCache[username] || {};

					return (
						<UserAvatarChip
							mie={4}
							mb={2}
							key={username}
							federated={currentCachedOption._federated}
							name={currentCachedOption.name}
							username={currentCachedOption.username || username}
							onMouseDown={onMouseDown}
						/>
					);
				}}
				renderOptions={AutocompleteOptions}
				options={options.concat(Object.entries(selectedCache)).map(([, item]) => [item.username, item.name || item.username])}
			/>
		</OptionsContext.Provider>
	);
};

export default memo(UserAutoCompleteMultiple);
