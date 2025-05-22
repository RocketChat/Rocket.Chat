import type { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import { Callout, ContextualbarV2Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import UnitEdit from './UnitEdit';

const UnitEditWithData = ({ unitId }: { unitId: IOmnichannelBusinessUnit['_id'] }) => {
	const { t } = useTranslation();

	const getUnitById = useEndpoint('GET', '/v1/livechat/units/:id', { id: unitId });
	const getMonitorsByUnitId = useEndpoint('GET', '/v1/livechat/units/:unitId/monitors', { unitId });
	const getDepartmentsByUnitId = useEndpoint('GET', '/v1/livechat/units/:unitId/departments', { unitId });

	const {
		data: unitData,
		isError,
		isLoading,
	} = useQuery({
		queryKey: ['livechat-getUnitById', unitId],
		queryFn: async () => getUnitById(),
		refetchOnWindowFocus: false,
	});
	const {
		data: unitMonitors,
		isError: unitMonitorsError,
		isLoading: unitMonitorsLoading,
	} = useQuery({
		queryKey: ['livechat-getMonitorsByUnitId', unitId],
		queryFn: async () => getMonitorsByUnitId({ unitId }),
		refetchOnWindowFocus: false,
	});
	const {
		data: unitDepartments,
		isError: unitDepartmentsError,
		isLoading: unitDepartmentsLoading,
	} = useQuery({
		queryKey: ['livechat-getDepartmentsByUnitId', unitId],
		queryFn: async () => getDepartmentsByUnitId({ unitId }),
		refetchOnWindowFocus: false,
	});

	if (isLoading || unitMonitorsLoading || unitDepartmentsLoading) {
		return <ContextualbarV2Skeleton />;
	}

	if (isError || unitMonitorsError || unitDepartmentsError) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return <UnitEdit unitData={unitData} unitMonitors={unitMonitors?.monitors} unitDepartments={unitDepartments?.departments} />;
};

export default UnitEditWithData;
