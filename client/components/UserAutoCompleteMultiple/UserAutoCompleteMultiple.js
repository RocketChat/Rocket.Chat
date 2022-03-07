import { MultiSelectFiltered, Box, Option, OptionAvatar, OptionContent, OptionDescription, Chip, CheckBox } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { memo, useEffect, useMemo, useState } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../lib/asyncState';
import UserAvatar from '../avatar/UserAvatar';

const query = (term = '') => ({ selector: JSON.stringify({ term }) });

const UserAutoCompleteMultiple = ({ valueIsId = false, ...props }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const [labelData, setLabelData] = useState({});
	const debouncedFilter = useDebouncedValue(filter, 1000);
	const { value: data, phase } = useEndpointData(
		'users.autocomplete',
		useMemo(() => query(debouncedFilter), [debouncedFilter]),
	);
	const options = useMemo(
		() => (data && data.items.map((user) => [valueIsId ? user._id : user.username, user.name])) || [],
		[data, valueIsId],
	);

	useEffect(() => {
		const newLabelData = Object.fromEntries((data && data.items.map((user) => [user._id, user.username])) || []);
		setLabelData((labelData) => ({ ...labelData, ...newLabelData }));
	}, [data]);

	const renderItem = ({ value, label, selected, ...props }) => {
		const username = valueIsId ? labelData[value] : value;
		return (
			<Option key={value} {...props}>
				<OptionAvatar>
					<UserAvatar username={username} size='x20' />
				</OptionAvatar>
				<OptionContent>
					{label} <OptionDescription>({username})</OptionDescription>
				</OptionContent>
				<CheckBox checked={selected} />
			</Option>
		);
	};

	const renderSelected = ({ value, onMouseDown }) => {
		const username = valueIsId ? labelData[value] : value;
		return (
			<Chip {...props} key={value} value={value} onClick={onMouseDown} margin='x4'>
				<UserAvatar size='x20' username={username} />
				<Box is='span' margin='none' mis='x4'>
					{username}
				</Box>
			</Chip>
		);
	};

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
