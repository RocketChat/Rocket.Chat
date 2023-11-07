import type { IOmnichannelCannedResponse, Serialized } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import CannedResponseEdit from './CannedResponseEdit';

type CannedResponseEditWithDataProps = {
	cannedResponseData: Serialized<IOmnichannelCannedResponse>;
	reload: () => void;
	totalDataReload: () => void;
};

const CannedResponseEditWithData = ({ cannedResponseData, reload, totalDataReload }: CannedResponseEditWithDataProps) => {
	const departmentId = useMemo(() => cannedResponseData?.departmentId, [cannedResponseData]) as string;
	const { value: departmentData, phase: state, error } = useEndpointData('/v1/livechat/department/:_id', { keys: { _id: departmentId } });

	const t = useTranslation();

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return (
		<CannedResponseEdit
			cannedResponseData={cannedResponseData}
			reload={reload}
			totalDataReload={totalDataReload}
			departmentData={departmentData.department}
		/>
	);
};

export default CannedResponseEditWithData;
