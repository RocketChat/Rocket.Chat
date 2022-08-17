import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState } from 'react';

import { AsyncStatePhase } from '../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../client/hooks/useEndpointData';
import BusinessHoursTable from './BusinessHoursTable';

const BusinessHoursTableContainer = () => {
	const t = useTranslation();
	const [params, setParams] = useState(() => ({ current: 0, itemsPerPage: 25, text: '' }));

	const {
		value: data,
		phase: state,
		reload,
	} = useEndpointData(
		'/v1/livechat/business-hours',
		useMemo(
			() => ({
				count: params.itemsPerPage,
				offset: params.current,
				name: params.text,
			}),
			[params],
		),
	);

	if (state === AsyncStatePhase.REJECTED) {
		return <Callout>{t('Error')}: error</Callout>;
	}

	return (
		<BusinessHoursTable
			businessHours={data?.businessHours}
			totalbusinessHours={data?.total}
			params={params}
			onChangeParams={setParams}
			reload={reload}
		/>
	);
};

export default BusinessHoursTableContainer;
