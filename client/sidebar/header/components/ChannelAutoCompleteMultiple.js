import React, { useMemo, useState } from 'react';
import { AutoComplete, Box, Option, Options, Chip } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useEndpointData } from '../../../hooks/useEndpointData';

const query = (term = '') => ({ selector: JSON.stringify({ term }) });

const Avatar = ({ value, ...props }) => <RoomAvatar size={Options.AvatarSize} username={value} {...props} />;

const ChannelAutoCompleteMultiple = React.memo((props) => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: data } = useEndpointData('channels.autocomplete', useMemo(() => query(debouncedFilter), [debouncedFilter]));
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
		renderSelected={({ value: selected }) => selected?.map((value) => <Chip key={value} {...props} height='x20' value={value} onClick={onClickRemove} mie='x4'><RoomAvatar size='x20' username={value} /><Box is='span' margin='none' mis='x4'>{value}</Box></Chip>)}
		renderItem={({ value, ...props }) => <Option key={value} {...props} avatar={<Avatar value={value} />} />}
		options={ options }
	/>;
});

export default ChannelAutoCompleteMultiple;
