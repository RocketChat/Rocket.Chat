import { Callout } from '@rocket.chat/fuselage';
import React, { useState, useMemo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import TriggersTable from './TriggersTable';

const TriggersTableContainer = ({ reloadRef }) => {
	const t = useTranslation();
	const [params, setParams] = useState(() => ({ current: 0, itemsPerPage: 25 }));

	const { current, itemsPerPage } = params;

	const {
		value: data,
		phase: state,
		reload,
	} = useEndpointData(
		'livechat/triggers',
		useMemo(() => ({ offset: current, count: itemsPerPage }), [current, itemsPerPage]),
	);

	reloadRef.current = reload;

	if (state === AsyncStatePhase.REJECTED) {
		return <Callout>{t('Error')}: error</Callout>;
	}

	return (
		<TriggersTable
			triggers={data?.triggers}
			totalTriggers={data?.total}
			params={params}
			onChangeParams={setParams}
			onDelete={reload}
		/>
	);
};

export default TriggersTableContainer;
