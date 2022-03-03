import { SelectFiltered, Option } from '@rocket.chat/fuselage';
import React, { memo, useEffect, useMemo, useState } from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import Avatar from './Avatar';

const findOption = (options, value) => {
	const option = options?.find((option) => option.teamId === value);
	return option && { name: option.name, avatarETag: option.avatarETag, type: option.t, _id: option._id };
};
const TeamAutocomplete = (props) => {
	const [filter, setFilter] = useState('');

	const { value: data } = useEndpointData(
		'teams.autocomplete',
		useMemo(() => ({ name: filter }), [filter]),
	);

	useEffect(() => {
		console.log(filter);
	}, [filter]);
	const options = useMemo(() => (data && data.teams.map(({ name, teamId }) => [teamId, name])) || [], [data]);

	const renderItem = ({ value, label, ...props }) => {
		const item = findOption(data?.teams, value);
		return <Option key={value} {...props} label={label} avatar={<Avatar {...item} />} />;
	};

	const renderSelected = ({ value, label }) => {
		const item = findOption(data?.teams, value);
		return (
			<>
				<Avatar size='x20' {...item} test='selected' /> {label}
			</>
		);
	};

	return (
		<SelectFiltered
			{...props}
			options={options}
			filter={filter}
			setFilter={setFilter}
			renderSelected={renderSelected}
			renderItem={renderItem}
			addonIcon='magnifier'
		/>
	);
};

export default memo(TeamAutocomplete);
