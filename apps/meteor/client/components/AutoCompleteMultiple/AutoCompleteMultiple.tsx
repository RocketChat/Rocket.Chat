import { AutoComplete, Box, Option, OptionAvatar, OptionContent, Chip } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { ComponentProps, memo, ReactElement, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import UserAvatar from '../avatar/UserAvatar';

const query = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ term }) });
type roomType = {
	label: string;
	value: string;
	_id: string;
	type: string;
};
type AutoCompleteMultipleProps = Omit<ComponentProps<typeof AutoComplete>, 'value' | 'filter' | 'onChange'> &
	Omit<ComponentProps<typeof Option>, 'value' | 'is' | 'className' | 'onChange'> & {
		onChange: (room: roomType, action: 'remove' | undefined) => void;
		value: any;
		filter?: string;
	};

const AutoCompleteMultiple = ({ onChange, ...props }: AutoCompleteMultipleProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: usersData } = useEndpointData(
		'/v1/users.autocomplete',
		useMemo(() => query(debouncedFilter), [debouncedFilter]),
	);
	const { value: roomsData } = useEndpointData(
		'/v1/rooms.autocomplete.channelAndPrivate',
		useMemo(() => query(filter), [filter]),
	);
	const users = useMemo(
		() => usersData?.items.map((user) => ({ _id: user._id, value: user.username, label: user.name, type: 'U' })) || [],
		[usersData],
	);
	const rooms = useMemo(
		() => roomsData?.items.map((room) => ({ _id: room._id, value: room.name, label: room.name, type: 'C' })) || [],
		[roomsData],
	);
	const options = [...users, ...rooms];

	const onClickRemove = useMutableCallback((e) => {
		e.stopPropagation();
		e.preventDefault();
		const room = options.find((cur) => cur.value === e.currentTarget.value) as roomType;
		onChange?.(room, 'remove');
	});
	const onChangeContent = (name: string, action: any) => {
		const room = options.find((cur) => cur.value === name) as roomType;
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
						{label} <Option.Description>({value})</Option.Description>
					</OptionContent>
				</Option>
			)}
			options={options}
		/>
	);
};

export default memo(AutoCompleteMultiple);