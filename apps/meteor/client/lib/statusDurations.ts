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
