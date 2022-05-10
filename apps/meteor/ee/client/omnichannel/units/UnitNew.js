import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import UnitEdit from './UnitEdit';

function UnitNew({ reload, allUnits }) {
	const t = useTranslation();

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

	if ([availableDepartmentsState, availableMonitorsState].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (availableDepartmentsError || availableMonitorsError) {
		return <Box mbs='x16'>{t('Not_found')}</Box>;
	}

	const filteredDepartments = {
		departments: availableDepartments.departments.filter(
			(department) =>
				!allUnits || !allUnits.units || !department.ancestors || !allUnits.units.find((unit) => unit._id === department.ancestors[0]),
		),
	};
	return <UnitEdit reload={reload} isNew availableDepartments={filteredDepartments} availableMonitors={availableMonitors} />;
}

export default UnitNew;
