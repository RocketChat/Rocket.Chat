import { AutoComplete, Box, Chip, Item, ItemContent, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { ITEM_MEDIA_SIZE, UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentPropsWithoutRef } from 'react';
import { memo, useMemo, useState } from 'react';

const query = (
	term = '',
	conditions = {},
): {
	selector: string;
} => ({ selector: JSON.stringify({ term, conditions }) });

export type UserAutoCompleteProps = Omit<ComponentPropsWithoutRef<typeof AutoComplete>, 'filter'> & {
	conditions?: { [key: string]: unknown };
};

const UserAutoComplete = ({ value, onChange, ...props }: UserAutoCompleteProps) => {
	const { conditions = {} } = props;
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const usersAutoCompleteEndpoint = useEndpoint('GET', '/v1/users.autocomplete');

	const { data } = useQuery({
		queryKey: ['usersAutoComplete', debouncedFilter, conditions],
		queryFn: async () => usersAutoCompleteEndpoint(query(debouncedFilter, conditions)),
	});

	const options = useMemo(() => data?.items.map((user) => ({ value: user.username, label: user.name || user.username })) || [], [data]);

	return (
		<AutoComplete
			{...props}
			value={value}
			onChange={onChange}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ selected: { value, label } }) => (
				<Chip height='x20' value={value} marginInlineEnd={4}>
					<UserAvatar size='x20' username={value} />
					<Box verticalAlign='middle' is='span' margin='none' marginInline={4}>
						{label}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, selected, focus, ...props }) => (
				<Item {...props} is='li' inset='md' selected={selected} focused={focus} aria-selected={selected}>
					<ItemMedia>
						<UserAvatar size={ITEM_MEDIA_SIZE.condensed} username={value} />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{label}</ItemTitle>
					</ItemContent>
				</Item>
			)}
			options={options}
		/>
	);
};

export default memo(UserAutoComplete);
