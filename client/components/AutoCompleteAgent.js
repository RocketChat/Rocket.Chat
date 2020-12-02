import React, { useMemo, useState } from 'react';
import { AutoComplete, Option } from '@rocket.chat/fuselage';

import { useTranslation } from '../contexts/TranslationContext';
import { useEndpointData } from '../hooks/useEndpointData';

export const AutoCompleteAgent = React.memo((props) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData('livechat/users/agent', useMemo(() => ({ text: filter }), [filter]));

	const options = useMemo(() => (data && [...data.users.map((user) => ({ value: user._id, label: user.name }))]) || [], [data]);
	const optionsWithAll = useMemo(() => (data && [{ value: 'all', label: t('All') }, ...data.users.map((user) => ({ value: user._id, label: user.name }))]) || [{ value: 'all', label: t('All') }], [data, t]);

	return <AutoComplete
		{...props}
		filter={filter}
		setFilter={setFilter}
		renderSelected={({ label }) => <>{label}</>}
		renderItem={({ value, ...props }) => <Option key={value} {...props} />}
		options={ props.empty ? options : optionsWithAll }
	/>;
});
