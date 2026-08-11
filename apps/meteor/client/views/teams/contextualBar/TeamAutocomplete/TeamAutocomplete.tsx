import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import type { AutoCompleteProps } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type TeamAutocompleteProps<TLabel = ReactNode> = Omit<AutoCompleteProps<TLabel>, 'filter'>;

const TeamAutocomplete = <TLabel = ReactNode,>({ value, onChange, ...props }: TeamAutocompleteProps<TLabel>) => {
	const [filter, setFilter] = useState('');

	const teamsAutoCompleteEndpoint = useEndpoint('GET', '/v1/teams.autocomplete');
	const { data, isSuccess } = useQuery({
		queryKey: ['teamsAutoComplete', filter],
		queryFn: async () => teamsAutoCompleteEndpoint({ name: filter }),
	});

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
			renderSelected={({ selected: { value, label: room } }) => (
				<Box value={value}>
					<RoomAvatar size='x20' room={room} /> {room.name}
				</Box>
			)}
			renderItem={({ value, label: room, ...props }) => (
				<Option key={value} {...props} label={room.name} avatar={<RoomAvatar size='x20' room={room} />} />
			)}
			options={options}
		/>
	);
};

export default memo(TeamAutocomplete);
