import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import React, { useState } from 'react';

import TriggersTable from './TriggersTable';

type paramsType = {
	current: number;
	itemsPerPage: 25 | 50 | 100;
};

const TriggersTableContainer = ({ reloadRef }: { reloadRef: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const [params, setParams] = useState<paramsType>(() => ({ current: 0, itemsPerPage: 25 }));

	const { current, itemsPerPage } = params;

	const getTriggers = useEndpoint('GET', '/v1/livechat/triggers');
	const { data, refetch, isError } = useQuery(['/v1/livechat/triggers'], () => getTriggers({ offset: current, count: itemsPerPage }));

	reloadRef.current = refetch;

	if (isError) {
		return <Callout>{t('Error')}: error</Callout>;
	}

	return (
		<TriggersTable
			triggers={data?.triggers || []}
			totalTriggers={data?.triggers.length || 0}
			params={params}
			onChangeParams={setParams}
			onDelete={refetch}
		/>
	);
};

export default TriggersTableContainer;
