import { MultiSelectFiltered, Box, Option, OptionAvatar, OptionContent, OptionDescription, Chip, CheckBox } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { memo, useMemo, useState } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../lib/asyncState';
import UserAvatar from '../avatar/UserAvatar';

const query = (term = '') => ({ selector: JSON.stringify({ term }) });

const UserAutoCompleteMultiple = (props) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: data, phase } = useEndpointData(
		'users.autocomplete',
		useMemo(() => query(debouncedFilter), [debouncedFilter]),
	);
	const options = useMemo(() => (data && data.items.map((user) => [user.username, user.name])) || [], [data]);

	const renderItem = ({ value, label, selected, ...props }) => (
		<Option key={value} {...props}>
			<OptionAvatar>
				<UserAvatar username={value} size='x20' />
			</OptionAvatar>
			<OptionContent>
				{label} <OptionDescription>({value})</OptionDescription>
			</OptionContent>
			<CheckBox checked={selected} />
		</Option>
	);

	const renderSelected = ({ value, onMouseDown }) => (
		<Chip {...props} key={value} value={value} onClick={onMouseDown} margin='x4'>
			<UserAvatar size='x20' username={value} />
			<Box is='span' margin='none' mis='x4'>
				{value}
			</Box>
		</Chip>
	);

	return (
		<MultiSelectFiltered
			{...props}
			options={options}
			filter={filter}
			setFilter={setFilter}
			renderSelected={renderSelected}
			renderItem={renderItem}
			addonIcon='magnifier'
			customEmpty={phase === AsyncStatePhase.LOADING ? t('Loading') : t('None')} // TODO: add proper empty state
		/>
	);
};

export default memo(UserAutoCompleteMultiple);
