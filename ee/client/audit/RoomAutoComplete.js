import React, { useMemo, useState } from 'react';
import { AutoComplete, Option, Options } from '@rocket.chat/fuselage';

import { useEndpointDataExperimental } from '../../../client/hooks/useEndpointDataExperimental';
import RoomAvatar from '../../../client/components/basic/avatar/RoomAvatar';

const query = (term = '') => ({ selector: JSON.stringify({ term }) });

const Avatar = ({ value, ...props }) => <RoomAvatar size={Options.AvatarSize} room={{ type: 'c', _id: value }} {...props} />;

const RoomAutoComplete = React.memo((props) => {
	const [filter, setFilter] = useState('');
	const { data } = useEndpointDataExperimental('rooms.autocomplete.channelAndPrivate', useMemo(() => query(filter), [filter]));
	const options = useMemo(() => (data && data.items.map(({ name, _id }) => ({ value: _id, label: name }))) || [], [data]);
	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={({ value, label }) => <><RoomAvatar size='x20' room={{ type: 'c', _id: value, name: label }} /> {label}</>}
		renderItem={({ value, ...props }) => <Option key={value} {...props} avatar={<Avatar value={value} />} />}
		options={ options }
	/>;
});

export default RoomAutoComplete;
