import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import UnitEdit from './UnitEdit';

const UnitEditWithData: FC<{
	unitId: string;
	title: string;
	reload: () => void;
}> = function UnitEditWithData({ unitId, reload, title }) {
	const { value: data, phase: state, error } = useEndpointData('/v1/livechat/units/:id', { keys: { id: unitId } });

	const {
		value: unitMonitors,
		phase: unitMonitorsState,
		error: unitMonitorsError,
	} = useEndpointData('/v1/livechat/units/:unitId/monitors', { keys: { unitId } });

	const {
		value: unitDepartments,
		phase: unitDepartmentsState,
		error: unitDepartmentsError,
	} = useEndpointData('/v1/livechat/units/:unitId/departments', { keys: { unitId } });

	const t = useTranslation();

	if ([state, unitMonitorsState, unitDepartmentsState].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (error || unitMonitorsError || unitDepartmentsError) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return (
		<UnitEdit
			title={title}
			unitId={unitId}
			data={data}
			unitMonitors={unitMonitors}
			unitDepartments={unitDepartments}
			reload={reload}
			isNew={false}
		/>
	);
};

export default UnitEditWithData;
