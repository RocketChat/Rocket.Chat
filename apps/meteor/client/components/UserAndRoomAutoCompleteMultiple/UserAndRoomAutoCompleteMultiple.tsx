import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Box, Option, OptionAvatar, OptionContent, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { RoomAvatar, UserAvatar } from '@rocket.chat/ui-avatar';
import { useUser, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { memo, useMemo, useState } from 'react';

import { Rooms } from '../../../app/models/client';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type UserAndRoomAutoCompleteMultipleProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'> & { limit?: number };

const UserAndRoomAutoCompleteMultiple = ({ value, onChange, limit, ...props }: UserAndRoomAutoCompleteMultipleProps) => {
	const user = useUser();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);

	const rooms = useUserSubscriptions(
		...useMemo<Parameters<typeof useUserSubscriptions>>(
			() => [
				{
					open: { $ne: false },
					$or: [
						{ lowerCaseFName: new RegExp(escapeRegExp(debouncedFilter), 'i') },
						{ lowerCaseName: new RegExp(escapeRegExp(debouncedFilter), 'i') },
					],
				},
				// We are using a higher limit here to take advantage of the amount that
				// will be filtered below into a smaller set respecting the limit prop.
				{ limit: 100 },
			],
			[debouncedFilter],
		),
	);

	const options = useMemo(() => {
		if (!user) {
			return [];
		}

		return rooms.reduce<Exclude<UserAndRoomAutoCompleteMultipleProps['options'], undefined>>((acc, room) => {
			if (acc.length === limit) return acc;

			if (isDirectMessageRoom(room) && (room.blocked || room.blocker)) {
				return acc;
			}

			if (roomCoordinator.readOnly(Rooms.state.get(room.rid), user)) return acc;

			return [
				...acc,
				{
					value: room.rid,
					label: {
						name: room.fname || room.name,
						avatarETag: room.avatarETag,
						type: room.t,
					},
				},
			];
		}, []);
	}, [limit, rooms, user]);

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			multiple
			renderSelected={({ selected: { value, label }, onRemove, ...props }) => (
				<Chip {...props} height='x20' value={value} onClick={onRemove} mie={4}>
					{label.t === 'd' ? (
						<UserAvatar size='x20' username={value} />
					) : (
						<RoomAvatar size='x20' room={{ type: label?.type, _id: value, ...label }} />
					)}
					<Box is='span' margin='none' mis={4}>
						{label.name}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, ...props }) => (
				<Option key={value} {...props}>
					<OptionAvatar>
						{label.t === 'd' ? (
							<UserAvatar size='x20' username={value} />
						) : (
							<RoomAvatar size='x20' room={{ type: label?.type, _id: value, ...label }} />
						)}
					</OptionAvatar>
					<OptionContent>{label.name}</OptionContent>
				</Option>
			)}
			options={options}
		/>
	);
};

export default memo(UserAndRoomAutoCompleteMultiple);
