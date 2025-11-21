import type { IRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
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

const AVATAR_SIZE = 'x20';

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
			result.isSuccess
				? result.data.rooms.map(({ name, fname, _id, avatarETag }) => ({
						value: _id,
						label: { name: fname || name, avatarETag },
					}))
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
			renderSelected={({ selected: { value, label } }) => (
				<>
					<Box margin='none' mi={2}>
						<RoomAvatar size={AVATAR_SIZE} room={{ type: 'p', _id: value, ...label }} />
					</Box>
					<Box margin='none' mi={2}>
						{label?.name}
					</Box>
					{renderRoomIcon?.({ ...label })}
				</>
			)}
			renderItem={({ value, label, ...props }) => (
				<Option {...props} label={label.name} avatar={<RoomAvatar size={AVATAR_SIZE} room={{ type: 'p', _id: value, ...label }} />} />
			)}
			options={options}
		/>
	);
};

export default memo(ABACRoomAutocomplete);
