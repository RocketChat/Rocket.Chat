import React, { useMemo, useState } from 'react';
import { AutoComplete, Option, Options } from '@rocket.chat/fuselage';

import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import UserAvatar from './avatar/UserAvatar';

const query = { selector: JSON.stringify({ term: '' }) };

const Avatar = ({ value, ...props }) => <UserAvatar size={Options.AvatarSize} {...console.log(value, props)} username={value} {...props} />

export const UserAutoComplete = (props) => {
	const [state, setState] = useState();
	const { data } = useEndpointDataExperimental('users.autocomplete', query);
	const options = useMemo(() => (data && data.items.map((user) => ({ value: user.username, label: user.name }))) || [], [data]);
	return <AutoComplete
		{...props}
		value={state}
		onChange={setState}
		renderSelected={({ value, label }) => <><UserAvatar size='x20' username={value} /> {label}</>}
		renderItem={({ value, ...props }) => <Option key={value} {...props} avatar={<Avatar value={value} />} />}
		options={ options }
	/>;
};
