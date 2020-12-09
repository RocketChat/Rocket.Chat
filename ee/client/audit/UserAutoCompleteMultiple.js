import React, { useMemo, useState } from 'react';
import { AutoComplete, Box, Option, Options, Chip } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import UserAvatar from '../../../client/components/avatar/UserAvatar';
import { useEndpointData } from '../../../client/hooks/useEndpointData';

const query = (term = '') => ({ selector: JSON.stringify({ term }) });

const Avatar = ({ value, ...props }) => <UserAvatar size={Options.AvatarSize} username={value} {...props} />;

const UserAutoCompleteMultiple = React.memo((props) => {
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData('users.autocomplete', useMemo(() => query(filter), [filter]));
	const options = useMemo(() => (data && data.items.map((user) => ({ value: user.username, label: user.name }))) || [], [data]);
	const onClickRemove = useMutableCallback((e) => {
		e.stopPropagation();
		e.preventDefault();
		props.onChange(e.currentTarget.value, 'remove');
	});

	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={({ value: selected }) => selected?.map((value) => <Chip key={value} {...props} height='x20' value={value} onClick={onClickRemove} mie='x4'><UserAvatar size='x20' username={value} /><Box is='span' margin='none' mis='x4'>{value}</Box></Chip>)}
		renderItem={({ value, ...props }) => <Option key={value} {...props} avatar={<Avatar value={value} />} />}
		options={ options }
	/>;
});

export default UserAutoCompleteMultiple;
