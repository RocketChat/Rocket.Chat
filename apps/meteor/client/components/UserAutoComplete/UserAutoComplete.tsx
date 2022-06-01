import { AutoComplete, Option, Box, Chip, Options } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { ComponentProps, memo, MouseEventHandler, ReactElement, useMemo, useState } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import UserAvatar from '../avatar/UserAvatar';

const query = (
	term = '',
	conditions = {},
): {
	selector: string;
} => ({ selector: JSON.stringify({ term, conditions }) });

type UserAutoCompleteProps = Omit<ComponentProps<typeof AutoComplete>, 'value' | 'filter'> &
	Omit<ComponentProps<typeof Option>, 'value'> & {
		conditions?: { [key: string]: unknown };
		onChange?: MouseEventHandler<HTMLButtonElement>;
		value: any;
		filter?: string;
	};

const UserAutoComplete = ({ value, ...props }: UserAutoCompleteProps): ReactElement => {
	const { conditions = {} } = props;
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: data } = useEndpointData(
		'users.autocomplete',
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useMemo(() => query(debouncedFilter, conditions), [filter]),
	);

	const options = useMemo(() => data?.items.map((user) => ({ value: user.username, label: user.name || user.username })) || [], [data]);

	return (
		<AutoComplete
			{...props}
			value={value}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ value, label }): ReactElement => {
				if (!value) {
					undefined;
				}

				return (
					<Chip height='x20' value={value} onClick={props.onChange} mie='x4'>
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
