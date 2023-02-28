import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import type { GenericTableParams } from '../../../components/GenericTable/GenericTable';
import TriggersTable from './TriggersTable';

const TriggersTableContainer = () => {
	const t = useTranslation();
	const [params, setParams] = useState<GenericTableParams>(() => ({ current: 0, itemsPerPage: 25 }));

	const { current, itemsPerPage } = params;

	const getTriggers = useEndpoint('GET', '/v1/livechat/triggers');
	const { data, refetch, isError } = useQuery(['/v1/livechat/triggers', current, itemsPerPage], () =>
		getTriggers({ offset: current, count: itemsPerPage }),
	);

	if (isError) {
		return <Callout>{t('Error')}: error</Callout>;
	}

	return (
		<TriggersTable
			triggers={data?.triggers || []}
			totalTriggers={data?.total || 0}
			params={params}
			onChangeParams={setParams}
			onDelete={refetch}
		/>
	);
};

export default TriggersTableContainer;
