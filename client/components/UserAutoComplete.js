import { AutoComplete, Option, Options } from '@rocket.chat/fuselage';
import React, { memo, useCallback, useMemo, useState } from 'react';

import { useEndpointData } from '../hooks/useEndpointData';
import UserAvatar from './avatar/UserAvatar';

const query = (term = '') => ({
	selector: JSON.stringify({ term }),
});

const UserAutoComplete = (props) => {
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData('users.autocomplete', useMemo(() => query(filter), [filter]));

	const renderSelected = useCallback(({ value, label }) => <>
		<UserAvatar size='x20' username={value} /> {label}
	</>, []);

	const renderItem = useCallback(({ value, ...props }) => <Option
		key={value}
		{...props}
		avatar={<UserAvatar size={Options.AvatarSize} username={value} />}
	/>, []);

	const options = useMemo(() => data?.items.map((user) => ({ value: user.username, label: user.name })) ?? [], [data]);

	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={renderSelected}
		renderItem={renderItem}
		options={ options }
	/>;
};

export default memo(UserAutoComplete);
