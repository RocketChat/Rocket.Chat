import { AutoComplete, Option, Chip, Box, Skeleton } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReactElement, ComponentProps } from 'react';
import { memo, useMemo, useState } from 'react';

const generateQuery = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ name: term }) });

type RoomAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'> & {
	readOnly?: boolean;
};

const RoomAutoCompleteMultiple = ({ value, onChange, ...props }: RoomAutoCompleteProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);
	const autocomplete = useEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate');

	const result = useQuery({
		queryKey: ['rooms.autocomplete.channelAndPrivate', filterDebounced],
		queryFn: () => autocomplete(generateQuery(filterDebounced)),
		placeholderData: keepPreviousData,
	});

	const options = useMemo(
		() =>
			result.isSuccess
				? result.data.items.map(({ fname, name, _id, avatarETag, t }) => ({
						value: _id,
						label: { name: fname || name, avatarETag, type: t },
					}))
				: [],
		[result.data?.items, result.isSuccess],
	);

	if (result.isPending) {
		return <Skeleton />;
	}

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			multiple
			renderSelected={({ selected: { value, label }, onRemove, ...props }): ReactElement => (
				<Chip {...props} key={value} value={value} onClick={onRemove}>
					<RoomAvatar size='x20' room={{ type: label?.type || 'c', _id: value, ...label }} />
					<Box is='span' margin='none' mis={4}>
						{label?.name}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, ...props }): ReactElement => (
				<Option
					key={value}
					{...props}
					label={label.name}
					avatar={<RoomAvatar size='x20' room={{ type: label?.type || 'c', _id: value, ...label }} />}
				/>
			)}
			options={options}
		/>
	);
};

export default memo(RoomAutoCompleteMultiple);
