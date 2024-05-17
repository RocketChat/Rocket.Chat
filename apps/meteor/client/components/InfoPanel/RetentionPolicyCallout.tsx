import { Callout } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { useFormattedRelativeTime } from '../../hooks/useFormattedRelativeTime';
import { getMaxAgeInMS } from '../../views/room/hooks/useRetentionPolicy';

type RetentionPolicyCalloutProps = {
	filesOnly: boolean;
	excludePinned: boolean;
	maxAge: number;
};

const RetentionPolicyCallout: FC<RetentionPolicyCalloutProps> = ({ filesOnly, excludePinned, maxAge }) => {
	const t = useTranslation();
	const retentionPolicyContentId = useUniqueId();
	const time = useFormattedRelativeTime(getMaxAgeInMS(maxAge));

	return (
		<Callout role='alert' aria-labelledby={retentionPolicyContentId} aria-live='polite' type='warning'>
			<div id={retentionPolicyContentId}>
				{filesOnly && excludePinned && <p>{t('RetentionPolicy_RoomWarning_FilesOnly', { time })}</p>}
				{filesOnly && !excludePinned && <p>{t('RetentionPolicy_RoomWarning_UnpinnedFilesOnly', { time })}</p>}
				{!filesOnly && excludePinned && <p>{t('RetentionPolicy_RoomWarning', { time })}</p>}
				{!filesOnly && !excludePinned && <p>{t('RetentionPolicy_RoomWarning_Unpinned', { time })}</p>}
			</div>
		</Callout>
	);
};

export default RetentionPolicyCallout;
