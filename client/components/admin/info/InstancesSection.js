import React from 'react';

import { formatDate } from './formatters';
import { useTranslation } from '../../../hooks/useTranslation';
import { InformationList } from './InformationList';
import { InformationEntry } from './InformationEntry';

export function InstancesSection({ instances }) {
	const t = useTranslation();

	if (!instances || !instances.length) {
		return null;
	}

	return <>
		<h3>{t('Broadcast_Connected_Instances')}</h3>
		{instances.map(({ address, broadcastAuth, currentStatus, instanceRecord }, i) =>
			<InformationList key={i}>
				<InformationEntry label={t('Address')}>{address}</InformationEntry>
				<InformationEntry label={t('Auth')}>{broadcastAuth}</InformationEntry>
				<InformationEntry label={<>{t('Current_Status')} > {t('Connected')}</>}>{currentStatus.connected}</InformationEntry>
				<InformationEntry label={<>{t('Current_Status')} > {t('Retry_Count')}</>}>{currentStatus.retryCount}</InformationEntry>
				<InformationEntry label={<>{t('Current_Status')} > {t('Status')}</>}>{currentStatus.status}</InformationEntry>
				<InformationEntry label={<>{t('Instance_Record')} > {t('ID')}</>}>{instanceRecord._id}</InformationEntry>
				<InformationEntry label={<>{t('Instance_Record')} > {t('PID')}</>}>{instanceRecord.pid}</InformationEntry>
				<InformationEntry label={<>{t('Instance_Record')} > {t('Created_at')}</>}>{formatDate(instanceRecord._createdAt)}</InformationEntry>
				<InformationEntry label={<>{t('Instance_Record')} > {t('Updated_at')}</>}>{formatDate(instanceRecord._updatedAt)}</InformationEntry>
			</InformationList>
		)}
	</>;
}
