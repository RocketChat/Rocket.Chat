import { AutoComplete, Option, Options } from '@rocket.chat/fuselage';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../hooks/useEndpointData';
import UserAvatar from './avatar/UserAvatar';

const query = (term = '') => ({ selector: JSON.stringify({ term }) });

const Avatar = ({ value, ...props }) => (
	<UserAvatar size={Options.AvatarSize} username={value} {...props} />
);

export const UserAutoComplete = memo((props) => {
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData(
		'users.autocomplete',
		useMemo(() => query(filter), [filter]),
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
});
