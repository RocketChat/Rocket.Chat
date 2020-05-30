import React from 'react';

import Subtitle from '../../components/basic/Subtitle';
import { useTranslation } from '../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';
import { DescriptionList } from './DescriptionList';

export function InstancesSection({ instances }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	if (!instances || !instances.length) {
		return null;
	}

	return <>
		{instances.map(({ address, broadcastAuth, currentStatus, instanceRecord }, i) =>
			<DescriptionList key={i} title={<Subtitle>{t('Broadcast_Connected_Instances')}</Subtitle>}>
				<DescriptionList.Entry label={t('Address')}>{address}</DescriptionList.Entry>
				<DescriptionList.Entry label={t('Auth')}>{broadcastAuth ? 'true' : 'false'}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Current_Status')} > {t('Connected')}</>}>{currentStatus.connected ? 'true' : 'false'}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Current_Status')} > {t('Retry_Count')}</>}>{currentStatus.retryCount}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Current_Status')} > {t('Status')}</>}>{currentStatus.status}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Instance_Record')} > {t('ID')}</>}>{instanceRecord._id}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Instance_Record')} > {t('PID')}</>}>{instanceRecord.pid}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Instance_Record')} > {t('Created_at')}</>}>{formatDateAndTime(instanceRecord._createdAt)}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Instance_Record')} > {t('Updated_at')}</>}>{formatDateAndTime(instanceRecord._updatedAt)}</DescriptionList.Entry>
			</DescriptionList>,
		)}
	</>;
}
