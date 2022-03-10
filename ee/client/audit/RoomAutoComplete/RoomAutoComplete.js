import { Option, SelectFiltered } from '@rocket.chat/fuselage';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import Avatar from './Avatar';

const query = (name = '') => ({ selector: JSON.stringify({ name }) });

const RoomAutoComplete = (props) => {
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData(
		'rooms.autocomplete.adminRooms',
		useMemo(() => query(filter), [filter]),
	);
	const options = useMemo(() => (data && data.items.map(({ name, _id }) => [_id, name])) || [], [data]);

	const renderSelected = ({ value, label }) => (
		<Option label={label.name} avatar={<Avatar value={value} room={{ _id: value, ...label }} />} />
	);

	const renderItem = ({ value, label, ...props }) => (
		<Option key={value} {...props} label={label.name} avatar={<Avatar value={value} {...label} />} />
	);

	return (
		<SelectFiltered
			{...props}
			filter={filter}
			setFilter={setFilter}
			renderSelected={renderSelected}
			renderItem={renderItem}
			options={options}
			addonIcon='magnifier'
		/>
	);
};

export default memo(RoomAutoComplete);
