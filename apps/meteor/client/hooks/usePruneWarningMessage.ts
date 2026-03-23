import type { IRoom } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useTranslation, useLanguage } from '@rocket.chat/ui-contexts';
import { intlFormat } from 'date-fns';
import { useEffect, useState } from 'react';

import { useFormattedRelativeTime } from './useFormattedRelativeTime';
import { getCronAdvancedTimerFromPrecisionSetting } from '../../lib/getCronAdvancedTimerFromPrecisionSetting';
import { useRetentionPolicy } from '../views/room/hooks/useRetentionPolicy';

const sendAt = (cronExpression: string): Date => {
	const parts = cronExpression.split(' ').filter(Boolean);

	if (parts.length !== 5 && parts.length !== 6) {
		throw new Error('Invalid cron expression');
	}

	const [minute, hour, dom, month, dow] = parts.length === 6 ? parts.slice(1) : parts;

	const match = (val: number, pattern: string): boolean => {
		if (pattern === '*') return true;
		if (pattern.includes(',')) return pattern.split(',').some((p) => match(val, p));
		if (pattern.includes('-')) {
			const [start, end] = pattern.split('-').map(Number);
			return val >= start && val <= end;
		}
		if (pattern.startsWith('*/')) {
			const step = parseInt(pattern.slice(2), 10);
			return val % step === 0;
		}
		return parseInt(pattern, 10) === val;
	};

	const now = new Date();
	const date = new Date(now.getTime() + 60 * 1000);
	date.setSeconds(0, 0);

	const limit = new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000);

	while (date < limit) {
		const curMinute = date.getMinutes();
		const curHour = date.getHours();
		const curDom = date.getDate();
		const curMonth = date.getMonth();
		const curDow = date.getDay();

		const domRestricted = dom !== '*';
		const dowRestricted = dow !== '*';
		const dayMatches =
			(!domRestricted && !dowRestricted) ||
			(domRestricted && !dowRestricted && match(curDom, dom)) ||
			(!domRestricted && dowRestricted && match(curDow, dow)) ||
			(domRestricted && dowRestricted && (match(curDom, dom) || match(curDow, dow)));

		if (match(curMinute, minute) && match(curHour, hour) && match(curMonth, month) && dayMatches) {
			return date;
		}

		date.setMinutes(date.getMinutes() + 1);
	}

	throw new Error('Invalid cron expression: unreachable date');
};

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

	const cronPrecision = useSetting<CronPrecisionSetting>('RetentionPolicy_Precision', '0');

	const t = useTranslation();

	const enableAdvancedCronTimer = useSetting('RetentionPolicy_Advanced_Precision', false);
	const advancedCronTimer = useSetting('RetentionPolicy_Advanced_Precision_Cron', '*/30 * * * *');

	const message = getMessage({ filesOnly, excludePinned });

	const nextRunDate = useNextRunDate({
		enableAdvancedCronTimer,
		advancedCronTimer,
		cronPrecision,
	});

	const maxAgeFormatted = useFormattedRelativeTime(maxAge);

	return t(message, { maxAge: maxAgeFormatted, nextRunDate });
};
