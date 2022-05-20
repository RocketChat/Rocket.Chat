import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, memo, ReactElement, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import RoomAvatar from '../avatar/RoomAvatar';
import Avatar from './Avatar';

const query = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ name: term }) });

type RoomAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'value' | 'filter'> & {
	value: any;
};

/* @deprecated */
const RoomAutoComplete = (props: RoomAutoCompleteProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData(
		'rooms.autocomplete.channelAndPrivate',
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
			{...props}
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
