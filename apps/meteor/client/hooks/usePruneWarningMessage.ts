import type { IRoom } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useTranslation, useLanguage } from '@rocket.chat/ui-contexts';
import { sendAt } from 'cron';
import intlFormat from 'date-fns/intlFormat';
import { useEffect, useState } from 'react';

import { getCronAdvancedTimerFromPrecisionSetting } from '../../lib/getCronAdvancedTimerFromPrecisionSetting';
import { useRetentionPolicy } from '../views/room/hooks/useRetentionPolicy';
import { useFormattedRelativeTime } from './useFormattedRelativeTime';

const getMessage = ({ filesOnly, excludePinned }: { filesOnly: boolean; excludePinned: boolean }): TranslationKey => {
	if (filesOnly) {
		return excludePinned
			? 'RetentionPolicy_RoomWarning_UnpinnedFilesOnly_NextRunDate'
			: 'RetentionPolicy_RoomWarning_FilesOnly_NextRunDate';
	}

	return excludePinned ? 'RetentionPolicy_RoomWarning_Unpinned_NextRunDate' : 'RetentionPolicy_RoomWarning_NextRunDate';
};

type CronPrecisionSetting = '0' | '1' | '2' | '3';
const getNextRunDate = ({
	enableAdvancedCronTimer,
	cronPrecision,
	advancedCronTimer,
}: {
	enableAdvancedCronTimer: boolean;
	cronPrecision: CronPrecisionSetting;
	advancedCronTimer: string;
}) => {
	if (enableAdvancedCronTimer) {
		return sendAt(advancedCronTimer);
	}

	return sendAt(getCronAdvancedTimerFromPrecisionSetting(cronPrecision));
};

const useNextRunDate = ({
	enableAdvancedCronTimer,
	advancedCronTimer,
	cronPrecision,
}: {
	enableAdvancedCronTimer: boolean;
	cronPrecision: CronPrecisionSetting;
	advancedCronTimer: string;
}) => {
	const [nextRunDate, setNextRunDate] = useSafely(useState(getNextRunDate({ enableAdvancedCronTimer, advancedCronTimer, cronPrecision })));
	const lang = useLanguage();

	useEffect(() => {
		const timeoutBetweenRunAndNow = nextRunDate.valueOf() - Date.now();

		const timeout = setTimeout(
			() => setNextRunDate(getNextRunDate({ enableAdvancedCronTimer, advancedCronTimer, cronPrecision })),
			timeoutBetweenRunAndNow,
		);

		return () => clearTimeout(timeout);
	}, [advancedCronTimer, cronPrecision, enableAdvancedCronTimer, nextRunDate, setNextRunDate]);

	return intlFormat(
		new Date(nextRunDate.valueOf()),
		{
			localeMatcher: 'best fit',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
		},
		{
			locale: lang,
		},
	);
};

export const usePruneWarningMessage = (room: IRoom) => {
	const retention = useRetentionPolicy(room);
	if (!retention) {
		throw new Error('usePruneWarningMessage - No room provided');
	}

	const { maxAge, filesOnly, excludePinned } = retention;

	const cronPrecision = String(useSetting('RetentionPolicy_Precision')) as CronPrecisionSetting;

	const t = useTranslation();

	const enableAdvancedCronTimer = Boolean(useSetting('RetentionPolicy_Advanced_Precision'));
	const advancedCronTimer = String(useSetting('RetentionPolicy_Advanced_Precision_Cron'));

	const message = getMessage({ filesOnly, excludePinned });

	const nextRunDate = useNextRunDate({
		enableAdvancedCronTimer,
		advancedCronTimer,
		cronPrecision,
	});

	const maxAgeFormatted = useFormattedRelativeTime(maxAge);

	return t(message, { maxAge: maxAgeFormatted, nextRunDate });
};
