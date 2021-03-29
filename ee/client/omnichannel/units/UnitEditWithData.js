import { Callout } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import UnitEdit from './UnitEdit';

function UnitEditWithData({ unitId, reload, allUnits }) {
	const query = useMemo(() => ({ unitId }), [unitId]);
	const { value: data, phase: state, error } = useEndpointData('livechat/units.getOne', query);
	const {
		value: availableDepartments,
		phase: availableDepartmentsState,
		error: availableDepartmentsError,
	} = useEndpointData('livechat/department');
	const {
		value: availableMonitors,
		phase: availableMonitorsState,
		error: availableMonitorsError,
	} = useEndpointData('livechat/monitors.list');
	const {
		value: unitMonitors,
		phase: unitMonitorsState,
		error: unitMonitorsError,
	} = useEndpointData('livechat/unitMonitors.list', query);

	const t = useTranslation();

	if (
		[state, availableDepartmentsState, availableMonitorsState, unitMonitorsState].includes(
			AsyncStatePhase.LOADING,
		)
	) {
		return <FormSkeleton />;
	}

	if (error || availableDepartmentsError || availableMonitorsError || unitMonitorsError) {
		return (
			<Callout m='x16' type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	const filteredDepartments = {
		departments: availableDepartments.departments.filter(
			(department) =>
				!allUnits ||
				!allUnits.units ||
				!department.ancestors ||
				department.ancestors[0] === unitId ||
				!allUnits.units.find((unit) => unit._id === department.ancestors[0]),
		),
	};

	return (
		<UnitEdit
			unitId={unitId}
			data={data}
			availableDepartments={filteredDepartments}
			availableMonitors={availableMonitors}
			unitMonitors={unitMonitors}
			reload={reload}
		/>
	);
}

export default UnitEditWithData;
