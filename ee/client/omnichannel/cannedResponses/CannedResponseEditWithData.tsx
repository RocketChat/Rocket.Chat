import { Callout } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import CannedResponseEdit from './CannedResponseEdit';
import CannedResponseEditWithDepartmentData from './CannedResponseEditWithDepartmentData';

const CannedResponseEditWithData: FC<{
	cannedResponseId: string;
	reload: () => void;
	totalDataReload: () => void;
}> = ({ cannedResponseId, reload, totalDataReload }) => {
	const {
		value: data,
		phase: state,
		error,
	} = useEndpointData(`canned-responses/${cannedResponseId}`);

	const { cannedResponse } = data || {};

	const t = useTranslation();

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !cannedResponse) {
		return (
			<Callout m='x16' type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	if (cannedResponse?.scope === 'department') {
		return (
			<CannedResponseEditWithDepartmentData
				data={{ cannedResponse }}
				reload={reload}
				totalDataReload={totalDataReload}
			/>
		);
	}

	return (
		<CannedResponseEdit
			data={{ cannedResponse }}
			reload={reload}
			totalDataReload={totalDataReload}
		/>
	);
};

export default CannedResponseEditWithData;
