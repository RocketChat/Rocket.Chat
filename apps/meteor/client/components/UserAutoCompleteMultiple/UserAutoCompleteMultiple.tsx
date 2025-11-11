import { AutoComplete, OptionAvatar, Option, OptionContent, OptionDescription } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useMemo, useState } from 'react';

import UserAvatarChip from './UserAvatarChip';

const query = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ term }) });

type UserAutoCompleteMultipleProps = Omit<ComponentProps<typeof AutoComplete>, 'filter'>;

// TODO: useDisplayUsername
const UserAutoCompleteMultiple = ({ onChange, ...props }: UserAutoCompleteMultipleProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const usersAutoCompleteEndpoint = useEndpoint('GET', '/v1/users.autocomplete');
	const { data } = useQuery({
		queryKey: ['usersAutoComplete', debouncedFilter],
		queryFn: async () => usersAutoCompleteEndpoint(query(debouncedFilter)),
	});

	const options = useMemo(() => data?.items.map((user) => ({ value: user.username, label: user.name })) || [], [data]);

	return (
		<AutoComplete
			{...props}
			filter={filter}
			setFilter={setFilter}
			onChange={onChange}
			multiple
			renderSelected={({ selected: { value: username, label }, onRemove, ...props }): ReactElement => (
				<UserAvatarChip {...props} username={username} name={label} mie={4} onClick={onRemove} />
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
