import type { IRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ComponentProps, Dispatch, ReactElement, SetStateAction } from 'react';
import { memo, useMemo, useState } from 'react';

const generateQuery = (
	term = '',
): {
	filter: string;
	types: string[];
} => ({ filter: term, types: ['p'] });

type ABACRoomAutocompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'> & {
	renderRoomIcon?: (props: { encrypted: IRoom['encrypted']; type: IRoom['t'] }) => ReactElement | null;
	setSelectedRoom?: Dispatch<SetStateAction<IRoom | undefined>>;
};

const ABACRoomAutocomplete = ({ value, onChange, renderRoomIcon, setSelectedRoom, ...props }: ABACRoomAutocompleteProps) => {
	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);
	const roomsAutoCompleteEndpoint = useEndpoint('GET', '/v1/rooms.adminRooms');

	const result = useQuery({
		// TODO use querykeys object
		queryKey: ['roomsAdminRooms', filterDebounced],
		queryFn: () => roomsAutoCompleteEndpoint(generateQuery(filterDebounced)),
		placeholderData: keepPreviousData,
	});

	const options = useMemo(
		() =>
			result.isSuccess && result.data?.rooms?.length > 0
				? result.data.rooms
						// Exclude rooms that are already managed by ABAC
						.filter((room) => !room.abacAttributes || room.abacAttributes.length === 0)
						.map((room) => {
							return {
								value: room._id,
								label: { name: room.fname || room.name },
							};
						})
				: [],
		[result.data?.rooms, result.isSuccess],
	);

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={(val) => {
				onChange(val);

				if (setSelectedRoom && typeof setSelectedRoom === 'function') {
					const selectedRoom = result?.data?.rooms.find(({ _id }) => _id === val) as unknown as IRoom;
					setSelectedRoom(selectedRoom);
				}
			}}
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
			options={options}
		/>
	);
};

export default memo(ABACRoomAutocomplete);
