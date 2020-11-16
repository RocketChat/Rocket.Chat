import React, { useMemo, useState } from 'react';
import { AutoComplete, Option } from '@rocket.chat/fuselage';

import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../contexts/TranslationContext';

export const AutoCompleteAgent = React.memo((props) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const { data } = useEndpointDataExperimental('livechat/users/agent', useMemo(() => ({ text: filter }), [filter]));

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
