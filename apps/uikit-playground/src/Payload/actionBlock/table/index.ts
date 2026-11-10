import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const table: readonly LayoutBlock[] = [
	{
		type: 'table',
		column_settings: [{ is_wrapped: true }, { align: 'right' }],
		rows: [
			[
				{ type: 'raw_text', text: 'Service' },
				{ type: 'raw_text', text: 'Uptime' },
			],
			[
				{ type: 'mrkdwn', text: '**API**' },
				{ type: 'raw_text', text: '99.98%' },
			],
			[
				{ type: 'mrkdwn', text: '**Push notifications gateway**' },
				{ type: 'raw_text', text: '97.10%' },
			],
		],
	},
];
