import { Serialized, DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { Box, Skeleton, States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import VerticalBar from '../../../../../client/components/VerticalBar';
import DeviceInfoContextualBar from './DeviceInfoContextualBar';
import { useEndpointData } from '/client/hooks/useEndpointData';
import { AsyncStatePhase } from '/client/lib/asyncState';

const convertSessionFromAPI = ({ loginAt, logoutAt, ...rest}: Serialized<DeviceManagementPopulatedSession>): DeviceManagementPopulatedSession => ({
	loginAt: new Date(loginAt),
	...(logoutAt && { logoutAt: new Date(logoutAt)}),
	...rest,
});

const DeviceInfoWithData = ({ deviceId, ...props }: { deviceId: string; onReload: () => void; }): ReactElement => {

	const t = useTranslation();

	const { value: data, phase, error, reload } = useEndpointData(
		'sessions/info.admin',
		useMemo(() => ({ sessionId: deviceId }), [deviceId]),
	);

	if (phase === AsyncStatePhase.LOADING) {
		return (
			<Box w='full' pb='x24'>
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
			</Box>
		);
	}

	if(error || !data) {
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
					<StatesTitle>{t('Something_Went_Wrong')}</StatesTitle>
					<StatesSubtitle>{t('We_Could_not_retrive_any_data')}</StatesSubtitle>
					<StatesSubtitle>{error?.message}</StatesSubtitle>
					<StatesActions>
						<StatesAction onClick={reload}>{t('Retry')}</StatesAction>
					</StatesActions>
				</States>
			</Box>
			</VerticalBar.Content>
			</VerticalBar>
		);
	}

	return <DeviceInfoContextualBar {...convertSessionFromAPI(data)}  {...props}/>;
};

export default DeviceInfoWithData;
