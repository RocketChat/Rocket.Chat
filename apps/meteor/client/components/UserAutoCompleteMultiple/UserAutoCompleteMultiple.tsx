import { AutoComplete, Box, OptionAvatar, Option, OptionContent, Chip, OptionDescription } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import UserAvatar from '../avatar/UserAvatar';

const query = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ term }) });

type UserAutoCompleteMultipleProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

// TODO: use useQuery & useDisplayUsername
const UserAutoCompleteMultiple = ({ onChange, ...props }: UserAutoCompleteMultipleProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: data } = useEndpointData('/v1/users.autocomplete', { params: useMemo(() => query(debouncedFilter), [debouncedFilter]) });

	const options = useMemo(() => data?.items.map((user) => ({ value: user.username, label: user.name })) || [], [data]);

	return (
		<AutoComplete
			{...props}
			filter={filter}
			setFilter={setFilter}
			onChange={onChange}
			multiple
			renderSelected={({ selected: { value, label }, onRemove }): ReactElement => (
				<Chip {...props} height='x20' value={value} onClick={onRemove} mie='x4'>
					<UserAvatar size='x20' username={value} />
					<Box is='span' margin='none' mis='x4'>
						{label}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, ...props }): ReactElement => (
				<Option data-qa-type='autocomplete-user-option' key={value} {...props}>
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

export default memo(UserAutoCompleteMultiple);
