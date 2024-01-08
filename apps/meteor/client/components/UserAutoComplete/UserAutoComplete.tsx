import { AutoComplete, Option, Box, Chip, Options } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

import UserAvatar from '../avatar/UserAvatar';

const query = (
	term = '',
	conditions = {},
): {
	selector: string;
} => ({ selector: JSON.stringify({ term, conditions }) });

type UserAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'> & {
	conditions?: { [key: string]: unknown };
};

const UserAutoComplete = ({ value, onChange, ...props }: UserAutoCompleteProps): ReactElement => {
	const { conditions = {} } = props;
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const usersAutoCompleteEndpoint = useEndpoint('GET', '/v1/users.autocomplete');

	const { data } = useQuery(['usersAutoComplete', debouncedFilter, conditions], async () =>
		usersAutoCompleteEndpoint(query(debouncedFilter, conditions)),
	);

	const options = useMemo(() => data?.items.map((user) => ({ value: user.username, label: user.name || user.username })) || [], [data]);

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			data-qa-id='UserAutoComplete'
			renderSelected={({ selected: { value, label } }): ReactElement | null => (
				<Chip height='x20' value={value} mie={4}>
					<UserAvatar size='x20' username={value} />
					<Box verticalAlign='middle' is='span' margin='none' mi={4}>
						{label}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, ...props }): ReactElement => (
				<Option key={value} label={label} avatar={<UserAvatar size={Options.AvatarSize} username={value} />} {...props} />
			)}
			options={options}
		/>
	);
};

export default memo(UserAutoComplete);
