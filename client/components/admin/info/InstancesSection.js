import React from 'react';

import { useTranslation } from '../../providers/TranslationProvider';
import { DescriptionList } from './DescriptionList';
import { formatDate } from './formatters';

export function InstancesSection({ instances }) {
	const t = useTranslation();

	if (!instances || !instances.length) {
		return null;
	}

	return <>
		<h3>{t('Broadcast_Connected_Instances')}</h3>
		{instances.map(({ address, broadcastAuth, currentStatus, instanceRecord }, i) =>
			<DescriptionList key={i}>
				<DescriptionList.Entry label={t('Address')}>{address}</DescriptionList.Entry>
				<DescriptionList.Entry label={t('Auth')}>{broadcastAuth}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Current_Status')} > {t('Connected')}</>}>{currentStatus.connected}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Current_Status')} > {t('Retry_Count')}</>}>{currentStatus.retryCount}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Current_Status')} > {t('Status')}</>}>{currentStatus.status}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Instance_Record')} > {t('ID')}</>}>{instanceRecord._id}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Instance_Record')} > {t('PID')}</>}>{instanceRecord.pid}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Instance_Record')} > {t('Created_at')}</>}>{formatDate(instanceRecord._createdAt)}</DescriptionList.Entry>
				<DescriptionList.Entry label={<>{t('Instance_Record')} > {t('Updated_at')}</>}>{formatDate(instanceRecord._updatedAt)}</DescriptionList.Entry>
			</DescriptionList>
		)}
	</>;
}
