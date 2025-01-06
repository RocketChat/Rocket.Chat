import type { IOmnichannelCannedResponse, Serialized } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import CannedResponseEdit from './CannedResponseEdit';
import { FormSkeleton } from '../../components/Skeleton';
import { AsyncStatePhase } from '../../hooks/useAsyncState';
import { useEndpointData } from '../../hooks/useEndpointData';

const CannedResponseEditWithDepartmentData = ({ cannedResponseData }: { cannedResponseData: Serialized<IOmnichannelCannedResponse> }) => {
	const departmentId = useMemo(() => cannedResponseData?.departmentId, [cannedResponseData]) as string;
	const { value: departmentData, phase: state, error } = useEndpointData('/v1/livechat/department/:_id', { keys: { _id: departmentId } });

	const { t } = useTranslation();

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

	return <CannedResponseEdit cannedResponseData={cannedResponseData} departmentData={departmentData.department} />;
};

export default CannedResponseEditWithDepartmentData;
