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
	selector: string;
} => ({ selector: JSON.stringify({ name: term }) });

type RoomAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'> & {
	scope?: 'admin' | 'regular';
	renderRoomIcon?: (props: { encrypted: IRoom['encrypted']; type: IRoom['t'] }) => ReactElement | null;
	setSelectedRoom?: Dispatch<SetStateAction<IRoom | undefined>>;
};

const AVATAR_SIZE = 'x20';

const ROOM_AUTOCOMPLETE_PARAMS = {
	admin: {
		endpoint: '/v1/rooms.autocomplete.adminRooms',
		key: 'roomsAutoCompleteAdmin',
	},
	regular: {
		endpoint: '/v1/rooms.autocomplete.channelAndPrivate',
		key: 'roomsAutoCompleteRegular',
	},
} as const;

const RoomAutoComplete = ({ value, onChange, scope = 'regular', renderRoomIcon, setSelectedRoom, ...props }: RoomAutoCompleteProps) => {
	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);
	const roomsAutoCompleteEndpoint = useEndpoint('GET', ROOM_AUTOCOMPLETE_PARAMS[scope].endpoint);

	const result = useQuery({
		queryKey: [ROOM_AUTOCOMPLETE_PARAMS[scope].key, filterDebounced],
		queryFn: () => roomsAutoCompleteEndpoint(generateQuery(filterDebounced)),
		placeholderData: keepPreviousData,
	});

	const options = useMemo(
		() =>
			result.isSuccess
				? result.data.items.map(({ name, fname, _id, avatarETag, t, encrypted }) => ({
						value: _id,
						label: { name: fname || name, avatarETag, type: t, encrypted },
					}))
				: [],
		[result.data?.items, result.isSuccess],
	);

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={(val) => {
				onChange(val);

				if (setSelectedRoom && typeof setSelectedRoom === 'function') {
					const selectedRoom = result?.data?.items.find(({ _id }) => _id === val) as unknown as IRoom;
					setSelectedRoom(selectedRoom);
				}
			}}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ selected: { value, label } }) => (
				<>
					<Box margin='none' mi={2}>
						<RoomAvatar size={AVATAR_SIZE} room={{ type: label?.type || 'c', _id: value, ...label }} />
					</Box>
					<Box margin='none' mi={2}>
						{label?.name}
					</Box>
					{renderRoomIcon?.({ ...label })}
				</>
			)}
			renderItem={({ value, label, ...props }) => (
				<Option {...props} label={label.name} avatar={<RoomAvatar size={AVATAR_SIZE} room={{ _id: value, ...label }} />} />
			)}
			options={options}
		/>
	);
};

export default memo(RoomAutoComplete);
