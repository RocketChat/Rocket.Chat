import { AutoComplete, Option } from '@rocket.chat/fuselage';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import Avatar from './Avatar';

const TeamAutocomplete = (props) => {
	const [filter, setFilter] = useState('');

	const { value: data } = useEndpointData(
		'teams.autocomplete',
		useMemo(() => ({ name: filter }), [filter]),
	);

	const options = useMemo(
		() =>
			(data &&
				data.teams.map(({ name, teamId, _id, avatarETag, t }) => ({
					value: teamId,
					label: { name, avatarETag, type: t, _id },
				}))) ||
			[],
		[data],
	);

	return (
		<AutoComplete
			{...props}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ label }) => (
				<>
					<Avatar size='x20' {...label} test='selected' /> {label.name}
				</>
			)}
			renderItem={({ value, label, ...props }) => <Option key={value} {...props} label={label.name} avatar={<Avatar {...label} />} />}
			options={options}
		/>
	);
};

export default memo(TeamAutocomplete);
