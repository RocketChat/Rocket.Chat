import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import RoomAvatar from '../avatar/RoomAvatar';
import Avatar from './Avatar';

const query = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ name: term }) });

type RoomAutoCompleteProps<T> = Omit<ComponentProps<typeof AutoComplete>, 'value' | 'filter' | 'onChange'> & {
	value: T;
	onChange: (value: TemplateStringsArray) => void;
};

/* @deprecated */
const RoomAutoComplete = <T,>(props: RoomAutoCompleteProps<T>): ReactElement => {
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData(
		'/v1/rooms.autocomplete.channelAndPrivate',
		useMemo(() => query(filter), [filter]),
	);
	const options = useMemo(
		() =>
			data?.items.map(({ name, _id, avatarETag, t }) => ({
				value: _id,
				label: { name, avatarETag, type: t },
			})) || [],
		[data],
	) as unknown as { value: string; label: string }[];

	return (
		<AutoComplete
			value={props.value as any}
			onChange={props.onChange as any}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ value, label }): ReactElement => (
				<>
					<Box margin='none' mi='x2'>
						<RoomAvatar size='x20' room={{ type: label?.type || 'c', _id: value, ...label }} />{' '}
					</Box>
					<Box margin='none' mi='x2'>
						{label?.name}
					</Box>
				</>
			)}
			renderItem={({ value, label, ...props }): ReactElement => (
				<Option key={value} {...props} label={label.name} avatar={<Avatar value={value} {...label} />} />
			)}
			options={options}
		/>
	);
};

export default memo(RoomAutoComplete);
