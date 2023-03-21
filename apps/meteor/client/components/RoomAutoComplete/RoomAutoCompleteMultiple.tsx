import { AutoComplete, Option, Chip, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
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

type RoomAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'value' | 'filter' | 'onChange'> &
	Omit<ComponentProps<typeof Option>, 'value' | 'is' | 'className' | 'onChange'> & {
		onChange: (value: any, action: 'remove' | undefined) => void;
		value: any;
		filter?: string;
	};

/* @deprecated */
// TODO: merge with RoomInput inside Teams
const RoomAutoCompleteMultiple = ({ onChange, ...props }: RoomAutoCompleteProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);
	const autocomplete = useEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate');

	const result = useQuery(['rooms.autocomplete.channelAndPrivate', filterDebounced], () => autocomplete(generateQuery(filterDebounced)), {
		keepPreviousData: true,
	});

	console.log(props.value);

	const options = useMemo(
		() =>
			result.isSuccess
				? result.data.items.map(({ name, _id, avatarETag, t }) => ({
						value: _id,
						label: { name, avatarETag, t },
				  }))
				: [],
		[result.data?.items, result.isSuccess],
	) as unknown as { value: string; label: string }[];

	const onClickRemove = useMutableCallback((e) => {
		e.stopPropagation();
		e.preventDefault();
		onChange?.(e.currentTarget.value, 'remove');
	});

	// if (result.isLoading) {
	// 	return <div>Loading</div>;
	// }

	return (
		<AutoComplete
			{...props}
			onChange={onChange as any}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ value: selected, label }): ReactElement =>
				selected?.map((value: any) => (
					<Chip key={value} {...props} height='x20' value={value} onClick={onClickRemove} mie='x4'>
						<RoomAvatar size='x20' room={{ type: label?.type || 'c', _id: value, ...label }} />{' '}
						<Box is='span' margin='none' mis='x4'>
							{label?.name}
						</Box>
					</Chip>
				))
			}
			renderItem={({ value, label, ...props }): ReactElement => (
				<Option key={value} {...props} label={label.name} avatar={<Avatar value={value} {...label} />} />
			)}
			options={options}
		/>
	);
};

export default memo(RoomAutoCompleteMultiple);
