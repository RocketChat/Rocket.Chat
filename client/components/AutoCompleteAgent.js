import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import React, { memo, useMemo, useState } from 'react';

import { useTranslation } from '../contexts/TranslationContext';
import { useEndpointData } from '../hooks/useEndpointData';

const AutoCompleteAgent = (props) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const { value: data } = useEndpointData(
		'livechat/users/agent',
		useMemo(() => ({ text: filter }), [filter]),
	);

	const options = useMemo(
		() => (data && [...data.users.map((user) => ({ value: user._id, label: user.name }))]) || [],
		[data],
	);
	const optionsWithAll = useMemo(
		() =>
			(data && [
				{ value: 'all', label: t('All') },
				...data.users.map((user) => ({ value: user._id, label: user.name })),
			]) || [{ value: 'all', label: t('All') }],
		[data, t],
	);

	return (
		<PaginatedSelectFiltered
			{...props}
			flexShrink={0}
			filter={filter}
			setFilter={setFilter}
			options={props.empty ? options : optionsWithAll}
		/>
	);
};

export default memo(AutoCompleteAgent);
