import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { memo, useState } from 'react';

import { ABACQueryKeys } from '../../../../lib/queryKeys';

const generateQuery = (
	term = '',
): {
	filter: string;
} => ({ filter: term });

type RoomFormAutocompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter' | 'onChange'> & {
	onSelectedRoom: (value: string, label: string) => void;
};

const RoomFormAutocomplete = ({ value, onSelectedRoom, ...props }: RoomFormAutocompleteProps) => {
	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);
	const roomsAutoCompleteEndpoint = useEndpoint('GET', '/v1/rooms.adminRooms.privateRooms');

	const result = useQuery({
		queryKey: ABACQueryKeys.rooms.autocomplete(generateQuery(filterDebounced)),
		queryFn: () => roomsAutoCompleteEndpoint(generateQuery(filterDebounced)),
		placeholderData: keepPreviousData,
		select: (data) =>
			data.rooms
				.filter((room) => !room.abacAttributes || room.abacAttributes.length === 0)
				.map((room) => ({
					value: room._id,
					label: { name: room.fname || room.name },
				})),
	});

	return (
		<AutoComplete
			{...props}
			onChange={(val) => {
				onSelectedRoom(val as string, result.data?.find(({ value }) => value === val)?.label?.name || '');
			}}
			value={value}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ selected: { label } }) => (
				<Box margin='none' mi={2}>
					{label?.name}
				</Box>
			)}
			renderItem={({ label, ...props }) => <Option {...props} label={label.name} />}
			options={result.data}
		/>
	);
};

export default memo(RoomFormAutocomplete);
