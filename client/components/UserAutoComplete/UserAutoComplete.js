import { AutoComplete, Option } from '@rocket.chat/fuselage';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import UserAvatar from '../avatar/UserAvatar';
import Avatar from './Avatar';

const query = (term = '', conditions = {}) => ({ selector: JSON.stringify({ term, conditions }) });

const UserAutoComplete = (props) => {
	const { conditions = {} } = props;
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData(
		'users.autocomplete',
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useMemo(() => query(filter, conditions), [filter]),
	);
	const options = useMemo(
		() => (data && data.items.map((user) => ({ value: user.username, label: user.name }))) || [],
		[data],
	);
	return (
		<AutoComplete
			{...props}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ value, label }) => (
				<>
					<UserAvatar size='x20' username={value} /> {label}
				</>
			)}
			renderItem={({ value, ...props }) => (
				<Option key={value} {...props} avatar={<Avatar value={value} />} />
			)}
			options={options}
		/>
	);
};

export default memo(UserAutoComplete);
