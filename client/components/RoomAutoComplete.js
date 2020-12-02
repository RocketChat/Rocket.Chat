import React, { useMemo, useState } from 'react';
import { AutoComplete, Option, Options } from '@rocket.chat/fuselage';

import RoomAvatar from './avatar/RoomAvatar';
import { useEndpointData } from '../hooks/useEndpointData';

const query = (term = '') => ({ selector: JSON.stringify({ name: term }) });

const Avatar = ({ value, type, avatarETag, ...props }) => <RoomAvatar size={Options.AvatarSize} room={{ type, _id: value, avatarETag }} {...props} />;

const RoomAutoComplete = React.memo((props) => {
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData('rooms.autocomplete.channelAndPrivate', useMemo(() => query(filter), [filter]));
	const options = useMemo(() => (data && data.items.map(({ name, _id, avatarETag, t }) => ({
		value: _id,
		label: { name, avatarETag, type: t },
	}))) || [], [data]);

	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={({
			value,
			label,
		}) => <><RoomAvatar size='x20' room={{ type: label?.type || 'c', _id: value, ...label }} /> {label?.name}</>}
		renderItem={({ value, label, ...props }) => <Option key={value} {...props} label={label.name} avatar={<Avatar value={value} {...label} />} />}
		options={ options }
	/>;
});

export default RoomAutoComplete;
