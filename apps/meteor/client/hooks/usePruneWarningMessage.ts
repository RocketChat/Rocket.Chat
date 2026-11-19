import type { IRoom } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useLanguage } from '@rocket.chat/ui-contexts';
import { intlFormat } from 'date-fns/intlFormat';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormattedRelativeTime } from './useFormattedRelativeTime';
import { getCronAdvancedTimerFromPrecisionSetting } from '../../lib/getCronAdvancedTimerFromPrecisionSetting';
import { getNextCronRunDate } from '../lib/getNextCronRunDate';
import { useRetentionPolicy } from '../views/room/hooks/useRetentionPolicy';

const MESSAGES = {
	nextRun: {
		all: 'RetentionPolicy_RoomWarning_NextRunDate',
		unpinned: 'RetentionPolicy_RoomWarning_Unpinned_NextRunDate',
		filesOnly: 'RetentionPolicy_RoomWarning_FilesOnly_NextRunDate',
		unpinnedFilesOnly: 'RetentionPolicy_RoomWarning_UnpinnedFilesOnly_NextRunDate',
	},
	banner: {
		all: 'RetentionPolicy_RoomBanner',
		unpinned: 'RetentionPolicy_RoomBanner_Unpinned',
		filesOnly: 'RetentionPolicy_RoomBanner_FilesOnly',
		unpinnedFilesOnly: 'RetentionPolicy_RoomBanner_UnpinnedFilesOnly',
	},
} as const satisfies Record<string, Record<string, TranslationKey>>;

const getMessage = (
	{ filesOnly, excludePinned }: { filesOnly: boolean; excludePinned: boolean },
	variant: keyof typeof MESSAGES,
): TranslationKey => {
	const messages = MESSAGES[variant];
	if (filesOnly) {
		return excludePinned ? messages.unpinnedFilesOnly : messages.filesOnly;
	}

	return excludePinned ? messages.unpinned : messages.all;
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
		return getNextCronRunDate(advancedCronTimer);
	}

	return getNextCronRunDate(getCronAdvancedTimerFromPrecisionSetting(cronPrecision));
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

export const usePruneWarningMessage = (room: IRoom, variant: keyof typeof MESSAGES = 'nextRun') => {
	const retention = useRetentionPolicy(room);
	if (!retention) {
		throw new Error('usePruneWarningMessage - No room provided');
	}

	const { maxAge, filesOnly, excludePinned } = retention;

	const cronPrecision = useSetting<CronPrecisionSetting>('RetentionPolicy_Precision', '0');

	const { t } = useTranslation();

	const enableAdvancedCronTimer = useSetting('RetentionPolicy_Advanced_Precision', false);
	const advancedCronTimer = useSetting('RetentionPolicy_Advanced_Precision_Cron', '*/30 * * * *');

	const message = getMessage({ filesOnly, excludePinned }, variant);

	const nextRunDate = useNextRunDate({
		enableAdvancedCronTimer,
		advancedCronTimer,
		cronPrecision,
	});

	const maxAgeFormatted = useFormattedRelativeTime(maxAge);

	return t(message, { maxAge: maxAgeFormatted, nextRunDate });
};
