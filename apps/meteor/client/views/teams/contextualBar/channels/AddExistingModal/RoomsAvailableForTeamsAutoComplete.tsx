import { AutoComplete, Box, Chip, Item, ItemContent, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { ITEM_MEDIA_SIZE, RoomAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { memo, useMemo, useState } from 'react';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';

export type RoomsAvailableForTeamsAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

const RoomsAvailableForTeamsAutoComplete = ({ value, onChange, ...props }: RoomsAvailableForTeamsAutoCompleteProps) => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);

	const roomsAvailableForTeamsAutoCompleteEndpoint = useEndpoint('GET', '/v1/rooms.autocomplete.availableForTeams');

	const { data } = useQuery({
		queryKey: ['roomsAvailableForTeamsAutoComplete', debouncedFilter],
		queryFn: async () => roomsAvailableForTeamsAutoCompleteEndpoint({ name: debouncedFilter }),
		placeholderData: keepPreviousData,
	});

	const options = useMemo(() => {
		if (!data) {
			return [];
		}

		return data.items.map((room) => ({
			value: room._id,
			label: {
				name: roomCoordinator.getRoomName(room.t, { _id: room._id, name: room.name, fname: room.fname, prid: room.prid }),
				type: room.t,
				avatarETag: room.avatarETag,
			},
		}));
	}, [data]);

	return (
		<AutoComplete
			{...props}
			multiple
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ selected: { value, label }, onRemove }) => (
				<Chip key={value} height='x20' value={value} onClick={onRemove} marginBlock={2} marginInlineEnd={4}>
					<RoomAvatar size='x20' room={{ ...label, type: label?.type || 'c', _id: value }} />
					<Box is='span' margin='none' marginInlineStart={4}>
						{label.name}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, selected, focus, ...props }) => (
				<Item {...props} is='li' inset='md' selected={selected} focused={focus} aria-selected={selected}>
					<ItemMedia>
						<RoomAvatar room={{ _id: value, type: label.type, avatarETag: label.avatarETag }} size={ITEM_MEDIA_SIZE.condensed} />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{label.name}</ItemTitle>
					</ItemContent>
				</Item>
			)}
			options={options}
		/>
	);
};

export default memo(RoomsAvailableForTeamsAutoComplete);
