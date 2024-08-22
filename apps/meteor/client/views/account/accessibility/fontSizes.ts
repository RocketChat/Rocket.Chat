import type { SelectOption } from '@rocket.chat/fuselage';

export const fontSizes: SelectOption[] = [
	[`${(14 / 16) * 100}%`, 'Small'],
	['100%', 'Default'],
	[`${(18 / 16) * 100}%`, 'Medium'],
	[`${(20 / 16) * 100}%`, 'Large'],
	[`${(24 / 16) * 100}%`, 'Extra large'],
];
