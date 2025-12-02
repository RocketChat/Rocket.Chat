import type { IRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useState } from 'react';

import { ABACQueryKeys } from '../../../lib/queryKeys';

const generateQuery = (
	term = '',
): {
	filter: string;
	types: string[];
} => ({ filter: term, types: ['p'] });

type ABACRoomAutocompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter' | 'onChange'> & {
	renderRoomIcon?: (props: { encrypted: IRoom['encrypted']; type: IRoom['t'] }) => ReactElement | null;
	onSelectedRoom: (value: string, label: string) => void;
};

const ABACRoomAutocomplete = ({ value, renderRoomIcon, onSelectedRoom, ...props }: ABACRoomAutocompleteProps) => {
	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);
	const roomsAutoCompleteEndpoint = useEndpoint('GET', '/v1/rooms.adminRooms');

	const result = useQuery({
		queryKey: ABACQueryKeys.rooms.roomsAutocomplete(generateQuery(filterDebounced)),
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
				<>
					<Box margin='none' mi={2}>
						{label?.name}
					</Box>
					{renderRoomIcon?.({ ...label })}
				</>
			)}
			renderItem={({ label, ...props }) => <Option {...props} label={label.name} />}
			options={result.data}
		/>
	);
};

export default memo(ABACRoomAutocomplete);
