import type { IOmnichannelAgent } from '@rocket.chat/core-typings';
import i18next from 'i18next';

import { getDateFnsLocale } from './locale';

export const normalizeAgent = (agentData: IOmnichannelAgent) =>
	agentData && { name: agentData.name, username: agentData.username, status: agentData.status };

export const normalizeQueueAlert = async (queueInfo: { spot: number; estimatedWaitTimeSeconds: number }) => {
	if (!queueInfo) {
		return;
	}
	const { default: formatDistance } = await import('date-fns/formatDistance');
	const { spot, estimatedWaitTimeSeconds } = queueInfo;
	const locale = await getDateFnsLocale();
	const estimatedWaitTime =
		estimatedWaitTimeSeconds && formatDistance(new Date().setSeconds(estimatedWaitTimeSeconds), new Date(), { locale });
	return (
		spot > 0 &&
		(estimatedWaitTime
			? i18next.t('your_spot_is_spot_estimated_wait_time_estimatedwai', { spot, estimatedWaitTime })
			: i18next.t('your_spot_is_spot', { spot }))
	);
};
