import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Box, Option, OptionAvatar, OptionContent, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { RoomAvatar, UserAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUser, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';

import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type UserAndRoomAutoCompleteMultipleProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'> & { limit?: number };

const UserAndRoomAutoCompleteMultiple = ({ value, onChange, limit, ...props }: UserAndRoomAutoCompleteMultipleProps): ReactElement => {
	const user = useUser();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);

	const rooms = useUserSubscriptions(
		useMemo(
			() => ({
				open: { $ne: false },
				$or: [
					{ lowerCaseFName: new RegExp(escapeRegExp(debouncedFilter), 'i') },
					{ lowerCaseName: new RegExp(escapeRegExp(debouncedFilter), 'i') },
				],
			}),
			[debouncedFilter],
		),
	).reduce((acc, room) => {
		if (acc.length === limit) return acc;
		if (!user) {
			return acc;
		}

		if (isDirectMessageRoom(room) && (room.blocked || room.blocker)) {
			return acc;
		}

		if (!roomCoordinator.readOnly(room.rid, user)) return [...acc, room];

		return acc;
	}, [] as Array<SubscriptionWithRoom>);

	const options = useMemo(
		() =>
			rooms.map(({ rid, fname, name, avatarETag, t }) => ({
				value: rid,
				label: { name: fname || name, avatarETag, type: t },
			})),
		[rooms],
	);

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			multiple
			renderSelected={({ selected: { value, label }, onRemove, ...props }): ReactElement => (
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
			renderItem={({ value, label, ...props }): ReactElement => (
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
