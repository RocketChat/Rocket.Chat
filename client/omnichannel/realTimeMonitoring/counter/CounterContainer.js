import React, { useEffect, useState } from 'react';
import { Skeleton } from '@rocket.chat/fuselage';

import { ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../../contexts/TranslationContext';
import CounterRow from './CounterRow';
import CounterItem from './CounterItem';

const CounterContainer = ({ data, state, initialData, ...props }) => {
	const t = useTranslation();

	const [displayData, setDisplayData] = useState(initialData);

	const {
		totalizers,
	} = data || { totalizers: initialData };

	useEffect(() => {
		if (state === ENDPOINT_STATES.DONE) {
			setDisplayData(totalizers);
		}
	}, [state, t, totalizers]);

	return <CounterRow {...props}>
		{displayData.map(({ title, value }, i) => <CounterItem key={i} title={title ? t(title) : <Skeleton width='x60' />} count={value}/>)}
	</CounterRow>;
};

export default CounterContainer;
