import { type RoomType, isDirectMessageRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Box, Chip, Option, OptionAvatar, OptionContent } from '@rocket.chat/fuselage';
import type { SelectOption } from '@rocket.chat/fuselage';
import { MultiSelectFiltered } from '@rocket.chat/fuselage-forms';
import { useDebouncedValue, useStableArray } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/tools';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUser, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEventHandler } from 'react';
import { memo, useMemo, useState } from 'react';

import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { Rooms } from '../../stores';

export type UserAndRoomAutoCompleteMultipleProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'> & {
	limit?: number;
	excludeTypes?: RoomType[];
	allowReadOnly?: boolean;
	keepDropdownOpenOnSelect?: boolean;
};

type RoomOptionLabel = {
	name: string | undefined;
	avatarETag: string | undefined;
	type: RoomType;
	searchLabel: string;
};

type AutoCompleteOption = {
	value: string;
	label: RoomOptionLabel;
}[];

const toOption = (room: SubscriptionWithRoom) => ({
	value: room.rid,
	label: {
		name: room.fname || room.name,
		avatarETag: room.avatarETag,
		type: room.t,
		searchLabel: [room.fname, room.name].filter(Boolean).join(' ') || room.rid,
	},
});

type RoomOptionProps = {
	role?: string;
	value: string;
	label: string;
	selected?: boolean;
	focus?: boolean;
	disabled?: boolean;
	onMouseDown: MouseEventHandler;
};

const UserAndRoomAutoCompleteMultiple = ({
	value,
	onChange,
	limit,
	excludeTypes,
	allowReadOnly = false,
	keepDropdownOpenOnSelect = false,
	...props
}: UserAndRoomAutoCompleteMultipleProps) => {
	const user = useUser();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const selectedIds = useStableArray(Array.isArray(value) ? value : []);

	const filterConditions = useMemo(
		() => [
			{ lowerCaseFName: new RegExp(escapeRegExp(debouncedFilter), 'i') },
			{ lowerCaseName: new RegExp(escapeRegExp(debouncedFilter), 'i') },
		],
		[debouncedFilter],
	);

	const selectedRooms = useUserSubscriptions(
		useMemo(() => ({ rid: { $in: selectedIds }, $or: filterConditions }), [filterConditions, selectedIds]),
	);
	const allSelectedRooms = useUserSubscriptions(useMemo(() => ({ rid: { $in: selectedIds } }), [selectedIds]));

	const rooms = useUserSubscriptions(
		...useMemo<Parameters<typeof useUserSubscriptions>>(
			() => [
				{
					open: { $ne: false },
					$or: filterConditions,
				},
				// We are using a higher limit here to take advantage of the amount that
				// will be filtered below into a smaller set respecting the limit prop.
				{ limit: 100 + selectedIds.length },
			],
			[filterConditions, selectedIds],
		),
	);

	const options = useMemo<AutoCompleteOption>(() => {
		const searchOptions = rooms.reduce<AutoCompleteOption>((acc, room) => {
			if (selectedIds.includes(room.rid)) return acc;

			if (acc.length === limit) return acc;

			if (excludeTypes?.includes(room.t)) return acc;

			if (isDirectMessageRoom(room) && (room.blocked || room.blocker)) {
				return acc;
			}

			if (!allowReadOnly && roomCoordinator.readOnly(Rooms.state.get(room.rid), user)) return acc;

			return [...acc, toOption(room)];
		}, []);

		if (!selectedIds.length) return searchOptions;

		return [...searchOptions, ...selectedRooms.map(toOption)];
	}, [allowReadOnly, excludeTypes, limit, rooms, selectedIds, selectedRooms, user]);

	const multiSelectRooms = useMemo(() => {
		const roomsById = new Map([...rooms, ...allSelectedRooms].map((room) => [room.rid, room] as const));
		return [...roomsById.values()];
	}, [allSelectedRooms, rooms]);

	const multiSelectOptions = useMemo<SelectOption[]>(() => {
		return multiSelectRooms.map((room): SelectOption => [room.rid, toOption(room).label.searchLabel]);
	}, [multiSelectRooms]);

	const multiSelectRoomLabels = useMemo(
		() =>
			new Map(
				multiSelectRooms.map(
					(room) => [room.rid, { name: room.fname || room.name || room.rid, avatarETag: room.avatarETag, type: room.t }] as const,
				),
			),
		[multiSelectRooms],
	);

	if (keepDropdownOpenOnSelect) {
		return (
			<MultiSelectFiltered
				{...props}
				value={Array.isArray(value) ? value : []}
				onChange={onChange}
				filter={filter}
				setFilter={setFilter}
				renderSelected={({ value, label, onMouseDown }: { value: string; label: string; onMouseDown: MouseEventHandler }) => {
					const roomLabel = multiSelectRoomLabels.get(value);

					return (
						<Chip height='x20' value={value} onMouseDown={onMouseDown} marginInlineEnd={4}>
							{roomLabel && (
								<RoomAvatar
									size='x20'
									room={{ name: roomLabel.name, avatarETag: roomLabel.avatarETag, type: roomLabel.type, _id: value }}
								/>
							)}
							<Box is='span' margin='none' marginInlineStart={4}>
								{roomLabel?.name ?? label}
							</Box>
						</Chip>
					);
				}}
				renderItem={({ value, label, ...props }: RoomOptionProps) => {
					const roomLabel = multiSelectRoomLabels.get(value);

					return (
						<Option key={value} value={value} {...props}>
							<OptionAvatar>
								{roomLabel && (
									<RoomAvatar
										size='x20'
										room={{ name: roomLabel.name, avatarETag: roomLabel.avatarETag, type: roomLabel.type, _id: value }}
									/>
								)}
							</OptionAvatar>
							<OptionContent>{roomLabel?.name ?? label}</OptionContent>
						</Option>
					);
				}}
				options={multiSelectOptions}
			/>
		);
	}

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			multiple
			renderSelected={({ selected: { value, label }, onRemove, ...props }) => (
				<Chip {...props} height='x20' value={value} onClick={onRemove} marginInlineEnd={4}>
					<RoomAvatar size='x20' room={{ name: label.name, avatarETag: label.avatarETag, type: label.type, _id: value }} />
					<Box is='span' margin='none' marginInlineStart={4}>
						{label.name}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, ...props }) => (
				<Option key={value} {...props}>
					<OptionAvatar>
						<RoomAvatar size='x20' room={{ name: label.name, avatarETag: label.avatarETag, type: label.type, _id: value }} />
					</OptionAvatar>
					<OptionContent>{label.name}</OptionContent>
				</Option>
			)}
			options={options}
		/>
	);
};

export default memo(UserAndRoomAutoCompleteMultiple);
