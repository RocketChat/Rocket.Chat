import React, { useMemo, useState } from 'react';
import { AutoComplete, Option, Options } from '@rocket.chat/fuselage';

import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useEndpointData } from '../../../hooks/useEndpointData';

const Avatar = ({ _id, type, avatarETag, test, ...props }) => <RoomAvatar size={Options.AvatarSize} room={{ type, _id, avatarETag }} {...props} />;

const TeamAutocomplete = React.memo((props) => {
	const [filter, setFilter] = useState('');

	const { value: data } = useEndpointData('teams.autocomplete', useMemo(() => ({ name: filter }), [filter]));

	const options = useMemo(() => (data && data.teams.map(({ name, teamId, _id, avatarETag, t }) => ({
		value: teamId,
		label: { name, avatarETag, type: t, _id },
	}))) || [], [data]);

	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={({ label }) => <><Avatar size='x20' {...label} test='selected' /> {label.name}</>}
		renderItem={({ value, label, ...props }) => <Option key={value} {...props} label={label.name} avatar={<Avatar {...label} />} />}
		options={ options }
	/>;
});

export default TeamAutocomplete;
