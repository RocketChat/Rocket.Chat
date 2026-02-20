import type { Serialized, DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import {
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarTitle,
	ContextualbarSkeletonBody,
} from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import DeviceManagementInfo from './DeviceManagementInfo';
import { deviceManagementQueryKeys } from '../../../../lib/queryKeys';

const convertSessionFromAPI = ({
	loginAt,
	logoutAt,
	...rest
}: Serialized<DeviceManagementPopulatedSession>): DeviceManagementPopulatedSession => ({
	loginAt: new Date(loginAt),
	...(logoutAt && { logoutAt: new Date(logoutAt) }),
	...rest,
});

const DeviceInfoWithData = ({ deviceId }: { deviceId: string }) => {
	const { t } = useTranslation();

	const getSessionInfo = useEndpoint('GET', '/v1/sessions/info.admin');
	const { isPending, isError, error, data } = useQuery({
		queryKey: deviceManagementQueryKeys.sessionInfo(deviceId),
		queryFn: () => getSessionInfo({ sessionId: deviceId }),
	});

	if (isPending) {
		return <ContextualbarSkeletonBody />;
	}

	if (isError) {
		return (
			<>
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
							<StatesSubtitle>{error.message}</StatesSubtitle>
						</States>
					</Box>
				</ContextualbarContent>
			</>
		);
	}

	return <DeviceManagementInfo {...convertSessionFromAPI(data)} />;
};

export default DeviceInfoWithData;
