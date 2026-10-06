import { AutoComplete, Box, Item, ItemContent, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
import { ITEM_MEDIA_SIZE, RoomAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { memo, useMemo, useState } from 'react';

export type TeamAutocompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

const TeamAutocomplete = ({ value, onChange, ...props }: TeamAutocompleteProps) => {
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
			renderItem={({ value: _value, label: room, selected, focus, ...props }) => (
				<Item {...props} is='li' inset='md' selected={selected} focused={focus} aria-selected={selected}>
					<ItemMedia>
						<RoomAvatar size={ITEM_MEDIA_SIZE.condensed} room={room} />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{room.name}</ItemTitle>
					</ItemContent>
				</Item>
			)}
			options={options}
		/>
	);
};

export default memo(TeamAutocomplete);
