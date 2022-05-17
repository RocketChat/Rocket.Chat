import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { useFormattedRelativeTime } from '../../hooks/useFormattedRelativeTime';

type RetentionPolicyCalloutProps = {
	filesOnlyDefault: boolean;
	excludePinnedDefault: boolean;
	maxAgeDefault: number;
};

const RetentionPolicyCallout: FC<RetentionPolicyCalloutProps> = ({ filesOnlyDefault, excludePinnedDefault, maxAgeDefault }) => {
	const t = useTranslation();

	const time = useFormattedRelativeTime(maxAgeDefault * 1000 * 60 * 60 * 24);

	return (
		<Callout type='warning'>
			{filesOnlyDefault && excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_FilesOnly', { time })}</p>}
			{filesOnlyDefault && !excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_UnpinnedFilesOnly', { time })}</p>}
			{!filesOnlyDefault && excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning', { time })}</p>}
			{!filesOnlyDefault && !excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_Unpinned', { time })}</p>}
		</Callout>
	);
};

export default RetentionPolicyCallout;
