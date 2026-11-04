import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const inputWithFileInput: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: {
			type: 'file_input',
			appId: 'app-id',
			blockId: 'block-id',
			actionId: 'action-id',
			filetypes: ['pdf', 'png'],
			max_files: 3,
		},
		label: {
			type: 'plain_text',
			text: 'Attachments',
			emoji: true,
		},
	},
];

export const file: readonly LayoutBlock[] = [{ type: 'file', file_id: 'file-id' }];
