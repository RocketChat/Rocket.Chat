import type { Serialized, DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import VerticalBar from '../../../../../../client/components/VerticalBar';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../../client/lib/asyncState';
import DeviceManagementInfo from './DeviceManagementInfo';

const convertSessionFromAPI = ({
	loginAt,
	logoutAt,
	...rest
}: Serialized<DeviceManagementPopulatedSession>): DeviceManagementPopulatedSession => ({
	loginAt: new Date(loginAt),
	...(logoutAt && { logoutAt: new Date(logoutAt) }),
	...rest,
});

const DeviceInfoWithData = ({ deviceId, onReload }: { deviceId: string; onReload: () => void }): ReactElement => {
	const t = useTranslation();

	const {
		value: data,
		phase,
		error,
	} = useEndpointData(
		'/v1/sessions/info.admin',
		useMemo(() => ({ sessionId: deviceId }), [deviceId]),
	);

	if (phase === AsyncStatePhase.LOADING) {
		return (
			<VerticalBar>
				<VerticalBar.Skeleton />
			</VerticalBar>
		);
	}

	if (error || !data) {
		return (
			<VerticalBar>
				<VerticalBar.Header>
					{t('Device_Info')}
					<VerticalBar.Close />
				</VerticalBar.Header>
				<VerticalBar.Content>
					<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
						<States>
							<StatesIcon name='warning' variation='danger' />
							<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
							<StatesSubtitle>{t('We_Could_not_retrive_any_data')}</StatesSubtitle>
							<StatesSubtitle>{error?.message}</StatesSubtitle>
						</States>
					</Box>
				</VerticalBar.Content>
			</VerticalBar>
		);
	}

	return <DeviceManagementInfo {...convertSessionFromAPI(data)} onReload={onReload} />;
};

export default DeviceInfoWithData;
