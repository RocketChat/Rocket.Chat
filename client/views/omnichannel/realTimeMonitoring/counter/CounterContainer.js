import React, { useEffect, useState } from 'react';
import { Skeleton } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../contexts/TranslationContext';
import CounterRow from './CounterRow';
import CounterItem from './CounterItem';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';

const CounterContainer = ({ data, state, initialData, ...props }) => {
	const t = useTranslation();

	const [displayData, setDisplayData] = useState(initialData);

	const {
		totalizers,
	} = data || { totalizers: initialData };

	useEffect(() => {
		if (state === AsyncStatePhase.RESOLVED) {
			setDisplayData(totalizers);
		}
	}, [state, t, totalizers]);

	return <CounterRow {...props}>
		{displayData.map(({ title, value }, i) => <CounterItem key={i} title={title ? t(title) : <Skeleton width='x60' />} count={value}/>)}
	</CounterRow>;
};

export default CounterContainer;
