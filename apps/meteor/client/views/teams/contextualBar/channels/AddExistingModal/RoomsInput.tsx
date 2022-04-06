import type { IRoom } from '@rocket.chat/core-typings';
import { Serialized } from '@rocket.chat/core-typings';
import { AutoComplete, Box, Icon, Option, Options, Chip, AutoCompleteProps } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import RoomAvatar from '../../../../../components/avatar/RoomAvatar';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';

type RoomsInputProps = {
	value: Serialized<IRoom>[];
	onChange: (value: Serialized<IRoom>, action: 'remove' | undefined) => void;
};

// TODO: Make AutoComplete accept arbitrary kinds of values
const useRoomsAutoComplete = (
	name: string,
): {
	rooms: Record<IRoom['_id'], Serialized<IRoom>>;
	options: AutoCompleteProps['options'];
} => {
	const params = useMemo(
		() => ({
			name,
		}),
		[name],
	);
	const { value: data } = useEndpointData('rooms.autocomplete.availableForTeams', params);

	const options = useMemo<AutoCompleteProps['options']>(() => {
		if (!data) {
			return [];
		}

		return data.items.map((room: Serialized<IRoom>) => ({
			label: roomCoordinator.getRoomName(room.t, { _id: room._id, name: room.name, fname: room.fname, prid: room.prid }),
			value: room._id,
		}));
	}, [data]);

	const rooms = useMemo<Record<IRoom['_id'], Serialized<IRoom>>>(
		() =>
			data?.items.reduce((obj, room) => {
				obj[room._id] = room;
				return obj;
			}, {} as Record<IRoom['_id'], Serialized<IRoom>>) ?? {},
		[data],
	);

	return {
		options,
		rooms,
	};
};

const RoomsInput: FC<RoomsInputProps> = ({ onChange, ...props }) => {
	const [filter, setFilter] = useState('');
	const { rooms, options } = useRoomsAutoComplete(useDebouncedValue(filter, 1000));

	const onClickSelected = useCallback(
		(e) => {
			e.stopPropagation();
			e.preventDefault();

			onChange(rooms[e.currentTarget.value], 'remove');
		},
		[onChange, rooms],
	);

	const handleChange = useCallback<AutoCompleteProps['onChange']>(
		(value, action: 'remove' | undefined) => {
			onChange(rooms[value as string], action);
		},
		[onChange, rooms],
	);

	const renderSelected = useCallback<FC<{ value?: IRoom[] }>>(
		({ value: selected }) => (
			<>
				{selected?.map((room) => (
					<Chip key={room._id} height='x20' value={room._id} onClick={onClickSelected} mie='x4'>
						<Icon name={room.t === 'c' ? 'hash' : 'hashtag-lock'} size='x12' />
						<Box is='span' margin='none' mis='x4'>
							{room.name}
						</Box>
					</Chip>
				))}
			</>
		),
		[onClickSelected],
	);

	const renderItem = useCallback<FC<{ value: IRoom['_id'] }>>(
		({ value: rid, ...props }) => (
			<Option key={rooms[rid]._id} {...props} avatar={<RoomAvatar room={rooms[rid]} size={Options.AvatarSize} />} />
		),
		[rooms],
	);

	return (
		<AutoComplete
			{...props}
			filter={filter}
			options={options}
			renderSelected={renderSelected}
			renderItem={renderItem}
			setFilter={setFilter}
			onChange={handleChange}
		/>
	);
};

export default memo(RoomsInput);
