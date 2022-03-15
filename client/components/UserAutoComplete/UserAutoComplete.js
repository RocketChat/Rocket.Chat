import { AutoComplete, Option, Box, Chip, Avatar } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import UserAvatar from '../avatar/UserAvatar';

const query = (term = '', conditions = {}) => ({ selector: JSON.stringify({ term, conditions }) });

const UserAutoComplete = (props) => {
	const { conditions = {} } = props;
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: data } = useEndpointData(
		'users.autocomplete',
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useMemo(() => query(debouncedFilter, conditions), [filter]),
	);

	const options = useMemo(() => (data && data.items.map((user) => ({ value: user.username, label: user.name }))) || [], [data]);

	return (
		<AutoComplete
			{...props}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ value, label }) => {
				if (!value) {
					return '';
				}

				return (
					<Chip height='x20' value={value} onClick={() => props.onChange()} mie='x4'>
						<UserAvatar size='x20' username={value} />
						<Box verticalAlign='middle' is='span' margin='none' mi='x4'>
							{label}
						</Box>
					</Chip>
				);
			}}
			renderItem={({ value, ...props }) => <Option key={value} {...props} avatar={<Avatar value={value} />} />}
			options={options}
		/>
	);
};

export default memo(UserAutoComplete);
