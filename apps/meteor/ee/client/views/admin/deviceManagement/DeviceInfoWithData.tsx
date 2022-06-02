import { Serialized, DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import DeviceInfoContextualBar from './DeviceInfoContextualBar';
import { useEndpointData } from '/client/hooks/useEndpointData';
import { AsyncStatePhase } from '/client/lib/asyncState';

const convertSessionFromAPI = ({ loginAt, logoutAt, ...rest}: Serialized<DeviceManagementPopulatedSession>): DeviceManagementPopulatedSession => ({
	loginAt: new Date(loginAt),
	...(logoutAt && { logoutAt: new Date(logoutAt)}),
	...rest,
});

const DeviceInfoWithData = ({ deviceId, ...props }: { deviceId?: string }): ReactElement => {

	const { value: data, phase, error } = useEndpointData(
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

	console.log("data = ", data, error);

	//TODO: Better Error handling, this breaks UI
	if(error || !data) {
		return (
			<Box fontScale='h2' pb='x20'>
				{JSON.stringify(error)}
			</Box>
		);
	}

	return <DeviceInfoContextualBar {...convertSessionFromAPI(data)} {...props}/>;
};

export default DeviceInfoWithData;
