import React, { FC } from 'react';
import { Callout } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';

type RetentionPolicyCalloutProps = {
	filesOnlyDefault: boolean;
	excludePinnedDefault: boolean;
	maxAgeDefault: number;
}

const RetentionPolicyCallout: FC<RetentionPolicyCalloutProps> = ({ filesOnlyDefault, excludePinnedDefault, maxAgeDefault }) => {
	const t = useTranslation();
	return <Callout type='warning'>
		{filesOnlyDefault && excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_FilesOnly', { time: maxAgeDefault })}</p>}
		{filesOnlyDefault && !excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_UnpinnedFilesOnly', { time: maxAgeDefault })}</p>}
		{!filesOnlyDefault && excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning', { time: maxAgeDefault })}</p>}
		{!filesOnlyDefault && !excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_Unpinned', { time: maxAgeDefault })}</p>}
	</Callout>;
};

export default RetentionPolicyCallout;
