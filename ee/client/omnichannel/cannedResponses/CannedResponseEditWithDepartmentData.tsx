import { Callout } from '@rocket.chat/fuselage';
import React, { useMemo, FC } from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { FromApi } from '../../../../definition/FromApi';
import { IOmnichannelCannedResponse } from '../../../../definition/IOmnichannelCannedResponse';
import CannedResponseEdit from './CannedResponseEdit';

const CannedResponseEditWithData: FC<{
	data:
		| {
				cannedResponse: FromApi<IOmnichannelCannedResponse>;
		  }
		| undefined;
	reload: () => void;
	totalDataReload: () => void;
}> = ({ data, reload, totalDataReload }) => {
	const departmentId = useMemo(() => data?.cannedResponse?.departmentId, [data]) as string;
	const {
		value: departmentData,
		phase: state,
		error,
	} = useEndpointData(`livechat/department/${departmentId}`);

	const t = useTranslation();

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error) {
		return (
			<Callout m='x16' type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return (
		<CannedResponseEdit
			data={data}
			reload={reload}
			totalDataReload={totalDataReload}
			departmentData={departmentData}
		/>
	);
};

export default CannedResponseEditWithData;
