import React, { useMemo, useState } from 'react';
import { AutoComplete, Option, Options } from '@rocket.chat/fuselage';

import UserAvatar from './avatar/UserAvatar';
import { useEndpointData } from '../hooks/useEndpointData';

const query = (term = '', conditions = {}) => ({ selector: JSON.stringify({ term, conditions }) });

const Avatar = ({ value, ...props }) => <UserAvatar size={Options.AvatarSize} username={value} {...props} />;

export const UserAutoComplete = React.memo((props) => {
	const { conditions = {} } = props;
	const [filter, setFilter] = useState('');
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const { value: data } = useEndpointData('users.autocomplete', useMemo(() => query(filter, conditions), [filter]));
	const options = useMemo(() => (data && data.items.map((user) => ({ value: user.username, label: user.name }))) || [], [data]);
	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={({ value, label }) => <><UserAvatar size='x20' username={value} /> {label}</>}
		renderItem={({ value, ...props }) => <Option key={value} {...props} avatar={<Avatar value={value} />} />}
		options={ options }
	/>;
});
