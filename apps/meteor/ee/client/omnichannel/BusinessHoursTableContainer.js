import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

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
	} = useEndpointData(`livechat/business-hours.list?count=${params.itemsPerPage}&offset=${params.current}&name=${params.text}`);

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
