import type { SubscriptionLabelColor } from '@rocket.chat/core-typings';
import type { RocketchatI18nKeys } from '@rocket.chat/i18n';

export const LABEL_COLOR_TOKENS = {
	default: 'font-default',
	red: 'status-font-on-danger',
	green: 'status-font-on-success',
	blue: 'status-font-on-info',
	yellow: 'status-font-on-warning',
} as const satisfies Record<SubscriptionLabelColor, string>;

export const LABEL_COLOR_NAMES = {
	default: 'Default',
	red: 'Label_color_red',
	green: 'Label_color_green',
	blue: 'Label_color_blue',
	yellow: 'Label_color_yellow',
} as const satisfies Record<SubscriptionLabelColor, RocketchatI18nKeys>;
