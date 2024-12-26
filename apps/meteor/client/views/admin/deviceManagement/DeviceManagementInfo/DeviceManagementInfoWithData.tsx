import type { Serialized, DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import DeviceManagementInfo from './DeviceManagementInfo';
import {
	Contextualbar,
	ContextualbarSkeleton,
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarTitle,
} from '../../../../components/Contextualbar';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../lib/asyncState';

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
	const { t } = useTranslation();

	const {
		value: data,
		phase,
		error,
	} = useEndpointData('/v1/sessions/info.admin', { params: useMemo(() => ({ sessionId: deviceId }), [deviceId]) });

	if (phase === AsyncStatePhase.LOADING) {
		return <ContextualbarSkeleton />;
	}

	if (error || !data) {
		return (
			<Contextualbar>
				<ContextualbarHeader>
					<ContextualbarTitle>{t('Device_Info')}</ContextualbarTitle>
					<ContextualbarClose />
				</ContextualbarHeader>
				<ContextualbarContent>
					<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
						<States>
							<StatesIcon name='warning' variation='danger' />
							<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
							<StatesSubtitle>{t('We_Could_not_retrive_any_data')}</StatesSubtitle>
							<StatesSubtitle>{error?.message}</StatesSubtitle>
						</States>
					</Box>
				</ContextualbarContent>
			</Contextualbar>
		);
	}

	return <DeviceManagementInfo {...convertSessionFromAPI(data)} onReload={onReload} />;
};

export default DeviceInfoWithData;
