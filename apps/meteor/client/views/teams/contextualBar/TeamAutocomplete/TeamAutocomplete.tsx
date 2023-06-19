import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import React, { memo, useMemo, useState } from 'react';

import Avatar from './Avatar';

type TeamAutocompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

const TeamAutocomplete = ({ value, onChange, ...props }: TeamAutocompleteProps) => {
	const [filter, setFilter] = useState('');

	const teamsAutoCompleteEndpoint = useEndpoint('GET', '/v1/teams.autocomplete');
	const { data, isSuccess } = useQuery(['teamsAutoComplete', filter], async () => teamsAutoCompleteEndpoint({ name: filter }));

	const options = useMemo(
		() =>
			isSuccess
				? data?.teams.map(({ name, teamId, _id, avatarETag, t }) => ({
						value: teamId as string,
						label: { name, avatarETag, type: t, _id },
				  }))
				: [],
		[data, isSuccess],
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
