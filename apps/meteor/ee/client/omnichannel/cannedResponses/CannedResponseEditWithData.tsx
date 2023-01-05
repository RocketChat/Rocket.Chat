import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import '../../../definition/rest';
import CannedResponseEdit from './CannedResponseEdit';
import CannedResponseEditWithDepartmentData from './CannedResponseEditWithDepartmentData';

const CannedResponseEditWithData: FC<{
	cannedResponseId: string;
	reload: () => void;
	totalDataReload: () => void;
}> = ({ cannedResponseId, reload, totalDataReload }) => {
	const { value: data, phase: state, error } = useEndpointData(`/v1/canned-responses/${cannedResponseId}`);

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

	if (data?.cannedResponse?.scope === 'department') {
		return <CannedResponseEditWithDepartmentData data={data} reload={reload} totalDataReload={totalDataReload} />;
	}

	return <CannedResponseEdit data={data} reload={reload} totalDataReload={totalDataReload} />;
};

export default CannedResponseEditWithData;
