import { AutoComplete, Option, Box, Chip, Options } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import UserAvatar from '../avatar/UserAvatar';

const query = (
	term = '',
	conditions = {},
): {
	selector: string;
} => ({ selector: JSON.stringify({ term, conditions }) });

type UserAutoCompleteProps = ComponentProps<typeof AutoComplete> & {
	conditions?: { [key: string]: unknown };
};

// TODO: use useQuery
const UserAutoComplete = ({ value, onChange, ...props }: UserAutoCompleteProps): ReactElement => {
	const { conditions = {} } = props;
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: data } = useEndpointData(
		'/v1/users.autocomplete',
		// eslint-disable-next-line react-hooks/exhaustive-deps
		{ params: useMemo(() => query(debouncedFilter, conditions), [filter]) },
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
				<Chip height='x20' value={value} mie='x4'>
					<UserAvatar size='x20' username={value} />
					<Box verticalAlign='middle' is='span' margin='none' mi='x4'>
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
