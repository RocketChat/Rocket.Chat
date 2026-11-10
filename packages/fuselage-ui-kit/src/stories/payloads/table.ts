import type * as UiKit from '@rocket.chat/ui-kit';

export const table: readonly UiKit.LayoutBlock[] = [
	{
		type: 'table',
		column_settings: [{ is_wrapped: true }, { align: 'right' }, { align: 'center' }],
		rows: [
			[
				{ type: 'raw_text', text: 'Service' },
				{ type: 'raw_text', text: 'Uptime' },
				{ type: 'raw_text', text: 'Status' },
			],
			[
				{ type: 'mrkdwn', text: '**API**' },
				{ type: 'raw_text', text: '99.98%' },
				{ type: 'mrkdwn', text: ':white_check_mark:' },
			],
			[
				{ type: 'mrkdwn', text: '**Push notifications gateway**' },
				{ type: 'raw_text', text: '97.10%' },
				{ type: 'mrkdwn', text: ':warning:' },
			],
		],
	},
] as const;
