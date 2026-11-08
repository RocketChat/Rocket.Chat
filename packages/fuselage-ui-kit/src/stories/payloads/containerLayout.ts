import type { LayoutBlock } from '@rocket.chat/ui-kit';

const icon = { type: 'image', image_url: 'https://picsum.photos/36/36', alt_text: 'A sample icon' } as const;

const records = [
	{ type: 'section', text: { type: 'mrkdwn', text: '*DCW-1024*\nStatus: Open → Closed' } },
	{ type: 'divider' },
	{ type: 'section', text: { type: 'mrkdwn', text: '*DCW-1025*\nStatus: In Progress → Closed' } },
	{
		type: 'actions',
		elements: [
			{
				type: 'button',
				appId: 'app-id',
				blockId: 'block-id',
				actionId: 'bulk_confirm',
				text: { type: 'plain_text', text: 'Confirm all' },
				style: 'primary',
			},
			{ type: 'button', appId: 'app-id', blockId: 'block-id', actionId: 'bulk_cancel', text: { type: 'plain_text', text: 'Cancel' } },
		],
	},
] as const;

const bulkUpdate = {
	type: 'container',
	title: { type: 'plain_text', text: 'Bulk update: 2 records selected' },
	subtitle: { type: 'plain_text', text: 'Review changes before confirming' },
	icon,
	is_collapsible: true,
	child_blocks: records,
} as const;

export const container: readonly LayoutBlock[] = [bulkUpdate];

export const containerCollapsed: readonly LayoutBlock[] = [{ ...bulkUpdate, default_collapsed: true }];

export const containerWithHeaderDivider: readonly LayoutBlock[] = [
	{
		type: 'container',
		title: { type: 'plain_text', text: 'Deal summary' },
		subtitle: { type: 'plain_text', text: 'Borant Corp' },
		has_header_divider: true,
		width: 'wide',
		child_blocks: records,
	},
];

const stat = (label: string, value: string) => ({ type: 'section', text: { type: 'mrkdwn', text: `*${label}*\n${value}` } }) as const;

export const layoutThreeColumns: readonly LayoutBlock[] = [
	{
		type: 'layout',
		label: 'Deal summary for Borant Corp',
		is_label_visible: true,
		rows: [
			{
				items: [
					{ block: stat('Stage', 'Negotiation'), width: 'narrow' },
					{ block: stat('Amount', '$125,000'), width: 'wide', horizontal_alignment: 'center' },
					{ block: stat('Close', '2026-08-15'), horizontal_alignment: 'end' },
				],
			},
			{ items: [{ block: stat('Next steps', 'Schedule sponsor meeting and finalize agreement') }] },
			{
				items: [
					{
						width: 'narrow',
						horizontal_alignment: 'end',
						block: {
							type: 'actions',
							elements: [
								{
									type: 'button',
									appId: 'app-id',
									blockId: 'block-id',
									actionId: 'view_deal',
									text: { type: 'plain_text', text: 'View deal' },
									style: 'primary',
								},
								{
									type: 'button',
									appId: 'app-id',
									blockId: 'block-id',
									actionId: 'update_stage',
									text: { type: 'plain_text', text: 'Update stage' },
									style: 'danger',
								},
							],
						},
					},
				],
			},
		],
		fallback: [{ type: 'section', text: { type: 'mrkdwn', text: '*Deal summary for Borant Corp*\nNegotiation · $125,000 · 2026-08-15' } }],
	},
];

export const layoutWithGridLines: readonly LayoutBlock[] = [
	{
		type: 'layout',
		label: 'Quarter at a glance',
		grid_lines: 'rows',
		rows: [
			{ items: [{ block: stat('Revenue', '$1.2M') }, { block: stat('Churn', '2.1%') }] },
			{ items: [{ block: stat('New accounts', '48') }, { block: stat('Open tickets', '312') }] },
			{
				items: [
					{
						block: {
							type: 'container',
							title: { type: 'plain_text', text: 'Notes' },
							child_blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'Renewals are on track.' } }],
						},
					},
				],
			},
		],
	},
];
