import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import Avatar from './Avatar';

type TeamAutocompleteProps = ComponentProps<typeof AutoComplete>;

const TeamAutocomplete = ({ value, onChange, ...props }: TeamAutocompleteProps) => {
	const [filter, setFilter] = useState('');

	const { value: data } = useEndpointData('/v1/teams.autocomplete', { params: useMemo(() => ({ name: filter }), [filter]) });

	const options = useMemo(
		() =>
			data?.teams.map(({ name, teamId, _id, avatarETag, t }) => ({
				value: teamId,
				label: { name, avatarETag, type: t, _id },
			})) || [],
		[data],
	);

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ selected: { value, label } }) => (
				<Box value={value}>
					<Avatar size='x20' {...label} /> {label.name}
				</Box>
			)}
			renderItem={({ value, label, ...props }) => <Option key={value} {...props} label={label.name} avatar={<Avatar {...label} />} />}
			options={options}
		/>
	);
};

export default memo(TeamAutocomplete);
