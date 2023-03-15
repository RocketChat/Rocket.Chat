import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { AutoComplete, Box, Option, OptionAvatar, OptionContent, OptionDescription, Chip } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useUser, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import UserAvatar from '../avatar/UserAvatar';

type roomType = {
	label: string;
	value: string;
	_id: string;
	type: string;
};

type UserAndRoomAutoCompleteMultipleProps = Omit<ComponentProps<typeof AutoComplete>, 'value' | 'filter' | 'onChange'> &
	Omit<ComponentProps<typeof Option>, 'value' | 'is' | 'className' | 'onChange'> & {
		onChange: (room: roomType, action?: 'remove') => void;
		value: any;
		filter?: string;
	};

const UserAndRoomAutoCompleteMultiple = ({ onChange, ...props }: UserAndRoomAutoCompleteMultipleProps): ReactElement => {
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

	const onClickRemove = useMutableCallback((e) => {
		e.stopPropagation();
		e.preventDefault();
		const room = options.find((cur) => cur.value === e.currentTarget.value) as unknown as roomType;
		onChange?.(room, 'remove');
	});

	const onChangeContent = (name: string, action: any): void => {
		const room = options.find((cur) => cur.value === name) as unknown as roomType;
		onChange(room, action);
	};

	return (
		<AutoComplete
			{...props}
			onChange={onChangeContent as any}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ value: selected }): ReactElement =>
				selected?.map((value: any) => (
					<Chip key={value} {...props} height='x20' value={value} onClick={onClickRemove} mie='x4'>
						<UserAvatar size='x20' username={value} />
						<Box is='span' margin='none' mis='x4'>
							{value}
						</Box>
					</Chip>
				))
			}
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
