export const pexipLayoutValues = [
	'one_main_zero_pips',
	'one_main_seven_pips',
	'one_main_twentyone_pips',
	'two_mains_twentyone_pips',
	'one_main_thirtythree_pips',
	'four_mains_zero_pips',
	'nine_mains_zero_pips',
	'sixteen_mains_zero_pips',
	'twentyfive_mains_zero_pips',
	'five_mains_seven_pips',
] as const;

export type PexipLayout = (typeof pexipLayoutValues)[number];

export const isPexipLayout = (value: string): value is PexipLayout => pexipLayoutValues.includes(value as PexipLayout);
