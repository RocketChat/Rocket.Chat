import type { IRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ComponentProps, Dispatch, ReactElement, SetStateAction } from 'react';
import { memo, useState } from 'react';

const generateQuery = (
	term = '',
): {
	filter: string;
	types: string[];
} => ({ filter: term, types: ['p'] });

type ABACRoomAutocompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'> & {
	renderRoomIcon?: (props: { encrypted: IRoom['encrypted']; type: IRoom['t'] }) => ReactElement | null;
	setSelectedRoomLabel: Dispatch<SetStateAction<string>>;
};

const ABACRoomAutocomplete = ({ value, renderRoomIcon, setSelectedRoomLabel, ...props }: ABACRoomAutocompleteProps) => {
	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);
	const roomsAutoCompleteEndpoint = useEndpoint('GET', '/v1/rooms.adminRooms');

	const result = useQuery({
		// TODO use querykeys object
		queryKey: ['roomsAdminRooms', filterDebounced],
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
				props.onChange(val);
				console.log(val);
				setSelectedRoomLabel(result.data?.find(({ value }) => value === val)?.label?.name || '');
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
