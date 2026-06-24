import type { TranslationContextValue } from '@rocket.chat/ui-contexts';

type DurationOption = {
	value: string;
	labelKey: 'Status_dont_clear' | 'Status_30_minutes' | 'Status_1_hour' | 'Status_choose_date_and_time';
	getExpiresAt?: (ctx: { now: Date; customDate?: string; customTime?: string }) => Date | undefined;
};

export const STATUS_DURATION_OPTIONS: DurationOption[] = [
	{ value: '', labelKey: 'Status_dont_clear' },
	{
		value: '30',
		labelKey: 'Status_30_minutes',
		getExpiresAt: ({ now }) => new Date(now.getTime() + 30 * 60_000),
	},
	{
		value: '60',
		labelKey: 'Status_1_hour',
		getExpiresAt: ({ now }) => new Date(now.getTime() + 60 * 60_000),
	},
	{
		value: 'custom',
		labelKey: 'Status_choose_date_and_time',
		getExpiresAt: ({ customDate, customTime }) => {
			if (!customDate || !customTime) {
				return undefined;
			}
			const date = new Date(`${customDate}T${customTime}`);
			return Number.isNaN(date.getTime()) ? undefined : date;
		},
	},
];

export const validateStatusExpiration = (
	value: string,
	{ statusCustomDate, statusCustomTime }: { statusCustomDate?: string; statusCustomTime?: string },
	t: TranslationContextValue['translate'],
): string | true => {
	if (value !== 'custom') {
		return true;
	}

	const expiresAt = STATUS_DURATION_OPTIONS.find((o) => o.value === value)?.getExpiresAt?.({
		now: new Date(),
		customDate: statusCustomDate,
		customTime: statusCustomTime,
	});

	if (!expiresAt) {
		return t('Status_choose_date_and_time');
	}

	if (expiresAt <= new Date()) {
		return t('Status_expiration_must_be_future');
	}

	return true;
};
