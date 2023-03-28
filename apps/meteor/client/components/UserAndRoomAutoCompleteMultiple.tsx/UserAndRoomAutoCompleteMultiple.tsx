import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Box, Option, OptionAvatar, OptionContent, OptionDescription, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useUser, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import UserAvatar from '../avatar/UserAvatar';

type UserAndRoomAutoCompleteMultipleProps = ComponentProps<typeof AutoComplete>;

// TODO: refactor the room avatar
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
			rooms.map((subscription) => ({
				_id: subscription.rid,
				value: subscription.name,
				label: subscription.name,
				t: subscription.t,
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
			renderSelected={({ selected: { value, label }, onRemove, ...props }): ReactElement => (
				<Chip {...props} height='x20' value={value} onClick={onRemove} mie='x4'>
					<UserAvatar size='x20' username={value} />
					<Box is='span' margin='none' mis='x4'>
						{label}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, ...props }): ReactElement => (
				<Option key={value} {...props}>
					<OptionAvatar>
						<UserAvatar username={value} size='x20' />
					</OptionAvatar>
					<OptionContent>
						{label} <OptionDescription>({value})</OptionDescription>
					</OptionContent>
				</Option>
			)}
			options={options}
		/>
	);
};

export default memo(UserAndRoomAutoCompleteMultiple);
