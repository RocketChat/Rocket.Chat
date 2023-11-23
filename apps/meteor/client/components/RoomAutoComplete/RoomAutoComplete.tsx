import { AutoComplete, Option, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, ComponentProps } from 'react';
import React, { memo, useMemo, useState } from 'react';

import RoomAvatar from '../avatar/RoomAvatar';
import Avatar from './Avatar';

const generateQuery = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ name: term }) });

type RoomAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

const RoomAutoComplete = ({ value, onChange, ...props }: RoomAutoCompleteProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);
	const autocomplete = useEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate');

	const result = useQuery(['rooms.autocomplete.channelAndPrivate', filterDebounced], () => autocomplete(generateQuery(filterDebounced)), {
		keepPreviousData: true,
	});

	const options = useMemo(
		() =>
			result.isSuccess
				? result.data.items.map(({ name, _id, avatarETag, t }) => ({
						value: _id,
						label: { name, avatarETag, type: t },
				  }))
				: [],
		[result.data?.items, result.isSuccess],
	);

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ selected: { value, label } }): ReactElement => (
				<>
					<Box margin='none' mi={2}>
						<RoomAvatar size='x20' room={{ type: label?.type || 'c', _id: value, ...label }} />
					</Box>
					<Box margin='none' mi={2}>
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
