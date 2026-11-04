import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const alert: readonly LayoutBlock[] = (['default', 'info', 'warning', 'error', 'success'] as const).map((level) => ({
	type: 'alert',
	level,
	text: { type: 'plain_text', text: `This is an alert with the ${level} level` },
}));
