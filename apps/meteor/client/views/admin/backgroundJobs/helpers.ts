import type { CronJobStatus } from '@rocket.chat/core-typings';
import type { Tag } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useLanguage } from '@rocket.chat/ui-contexts';
import cronstrue from 'cronstrue/i18n';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';

export const statusVariant = (status?: CronJobStatus): ComponentProps<typeof Tag>['variant'] => {
	switch (status) {
		case 'running':
			return 'primary';
		case 'scheduled':
			return 'secondary-info';
		case 'completed':
			return 'featured';
		case 'failed':
			return 'danger';
		case 'disabled':
			return 'warning';
		default:
			return undefined;
	}
};

export const useTranslateInterval = () => {
	const language = useLanguage();
	const locale = language?.replaceAll('-', '_') || 'en';

	return useCallback(
		(interval: string | number | undefined): string => {
			if (interval === undefined) {
				return '';
			}
			if (typeof interval === 'number') {
				return interval.toString();
			}
			try {
				return cronstrue.toString(interval, { locale });
			} catch {
				return interval;
			}
		},
		[locale],
	);
};

export const formatDuration = (startedAt?: Date | string, finishedAt?: Date | string): string => {
	if (!startedAt || !finishedAt) {
		return '';
	}
	const diffMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
	if (Number.isNaN(diffMs) || diffMs < 0) {
		return '';
	}
	if (diffMs < 1000) {
		return `${diffMs}ms`;
	}
	return `${(diffMs / 1000).toFixed(1)}s`;
};

export const STATUS_LABEL = {
	running: 'Background_Job_Status_running',
	scheduled: 'Background_Job_Status_scheduled',
	completed: 'Background_Job_Status_completed',
	failed: 'Background_Job_Status_failed',
	disabled: 'Background_Job_Status_disabled',
} satisfies Record<CronJobStatus, TranslationKey>;