import type { DataTableCell, LayoutBlock } from '@rocket.chat/ui-kit';

const tickets = [
	['Login fails with SSO', 'Open', 12],
	['Slow message search', 'In progress', 7],
	['Export times out', 'Open', 31],
	['Webhook retries twice', 'Resolved', 3],
	['Avatar does not update', 'In progress', 5],
	['Wrong unread badge', 'Open', 18],
	['Missing audit entry', 'Resolved', 44],
] as const;

export const dataTable: readonly LayoutBlock[] = [
	{
		type: 'data_table',
		blockId: 'tickets',
		caption: 'Support tickets',
		page_size: 5,
		rows: [
			[
				{ type: 'raw_text', text: 'Ticket' },
				{ type: 'raw_text', text: 'Status' },
				{ type: 'raw_text', text: 'Age in days' },
				{ type: 'raw_text', text: 'Action' },
			],
			...tickets.map(([title, status, age], index): readonly DataTableCell[] => [
				{ type: 'raw_text', text: title },
				{
					type: 'rich_text',
					elements: [
						{
							type: 'rich_text_section',
							elements: [{ type: 'text', text: status, style: status === 'Open' ? { bold: true } : undefined }],
						},
					],
				},
				{ type: 'raw_number', value: age, text: `${age} d` },
				{
					type: 'action_cell',
					element: {
						type: 'button',
						appId: 'tickets',
						blockId: 'tickets',
						actionId: 'open_ticket',
						text: { type: 'plain_text', text: 'Open' },
						value: `ticket_${index + 1}`,
					},
					fallback: { type: 'raw_text', text: 'Open' },
				},
			]),
		],
	},
];
