import { AutoComplete, Box, OptionAvatar, Option, OptionContent, Chip, OptionDescription } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

import UserAvatar from '../avatar/UserAvatar';

const query = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ term }) });

type UserAutoCompleteMultipleProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

// TODO: useDisplayUsername
const UserAutoCompleteMultiple = ({ onChange, ...props }: UserAutoCompleteMultipleProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const usersAutoCompleteEndpoint = useEndpoint('GET', '/v1/users.autocomplete');
	const { data } = useQuery(['usersAutoComplete', debouncedFilter], async () => usersAutoCompleteEndpoint(query(debouncedFilter)));

	const options = useMemo(() => data?.items.map((user) => ({ value: user.username, label: user.name })) || [], [data]);

	return (
		<AutoComplete
			{...props}
			filter={filter}
			setFilter={setFilter}
			onChange={onChange}
			multiple
			renderSelected={({ selected: { value, label }, onRemove }): ReactElement => (
				<Chip {...props} height='x20' value={value} onClick={onRemove} mie={4}>
					<UserAvatar size='x20' username={value} />
					<Box is='span' margin='none' mis={4}>
						{label}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, ...props }): ReactElement => (
				<Option data-qa-type='autocomplete-user-option' key={value} {...props}>
					<OptionAvatar>
						<UserAvatar username={value} size='x20' />
					</OptionAvatar>
					<OptionContent>
						{label} <OptionDescription>({value})</OptionDescription>
					</OptionContent>
				</Option>
			)}
			options={options}
		/>
	);
};

export default memo(UserAutoCompleteMultiple);
