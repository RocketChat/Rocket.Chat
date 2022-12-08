import type { IOmnichannelCannedResponse, Serialized } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo } from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import CannedResponseEdit from './CannedResponseEdit';

const CannedResponseEditWithData: FC<{
	data:
		| {
				cannedResponse: Serialized<IOmnichannelCannedResponse>;
		  }
		| undefined;
	reload: () => void;
	totalDataReload: () => void;
}> = ({ data, reload, totalDataReload }) => {
	const departmentId = useMemo(() => data?.cannedResponse?.departmentId, [data]) as string;
	const { value: departmentData, phase: state, error } = useEndpointData(`/v1/livechat/department/${departmentId}`);

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
			// @ts-expect-error - Path is inferring union type instead of most-specific one
			departmentData={departmentData}
		/>
	);
};

export default CannedResponseEditWithData;
