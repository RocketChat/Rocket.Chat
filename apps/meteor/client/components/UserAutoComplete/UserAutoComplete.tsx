import { AutoComplete, Option, Box, Chip, Options } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { ComponentProps, memo, ReactElement, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import UserAvatar from '../avatar/UserAvatar';

const query = (
	term = '',
	conditions = {},
): {
	selector: string;
} => ({ selector: JSON.stringify({ term, conditions }) });

type UserAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'value' | 'filter' | 'onChange'> &
	Omit<ComponentProps<typeof Option>, 'value' | 'onChange'> & {
		conditions?: { [key: string]: unknown };
		filter?: string;
		value: string;
		onChange?: (value: string) => void;
	};

const UserAutoComplete = ({ value, ...props }: UserAutoCompleteProps): ReactElement => {
	const { conditions = {} } = props;
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: data } = useEndpointData(
		'/v1/users.autocomplete',
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useMemo(() => query(debouncedFilter, conditions), [filter]),
	);

	const options = useMemo(() => data?.items.map((user) => ({ value: user.username, label: user.name || user.username })) || [], [data]);

	return (
		<AutoComplete
			value={value as any}
			onChange={props.onChange as any}
			filter={filter}
			setFilter={setFilter}
			data-qa-id='UserAutoComplete'
			renderSelected={({ value, label }): ReactElement | null => {
				if (!value) {
					return null;
				}

				return (
					<Chip height='x20' value={value} onClick={(_e: any): void => props.onChange?.(value)} mie='x4'>
						<UserAvatar size='x20' username={value} />
						<Box verticalAlign='middle' is='span' margin='none' mi='x4'>
							{label}
						</Box>
					</Chip>
				);
			}}
			renderItem={({ value, ...props }): ReactElement => (
				<Option key={value} avatar={<UserAvatar size={Options.AvatarSize} username={value} />} {...props} />
			)}
			options={options}
		/>
	);
};

export default memo(UserAutoComplete);
