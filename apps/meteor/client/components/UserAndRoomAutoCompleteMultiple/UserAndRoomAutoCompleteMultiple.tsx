import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Box, Option, OptionAvatar, OptionContent, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useUser, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import RoomAvatar from '../avatar/RoomAvatar';
import UserAvatar from '../avatar/UserAvatar';

type UserAndRoomAutoCompleteMultipleProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

const UserAndRoomAutoCompleteMultiple = ({ value, onChange, ...props }: UserAndRoomAutoCompleteMultipleProps): ReactElement => {
	const user = useUser();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);

	const rooms = useUserSubscriptions(
		useMemo(() => ({ open: { $ne: false }, lowerCaseName: new RegExp(escapeRegExp(debouncedFilter), 'i') }), [debouncedFilter]),
	).filter((room) => {
		if (!user) {
			return;
		}

		if (isDirectMessageRoom(room) && (room.blocked || room.blocker)) {
			return;
		}

		return !roomCoordinator.readOnly(room.rid, user);
	});

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
