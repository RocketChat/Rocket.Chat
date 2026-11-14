import type * as UiKit from '@rocket.chat/ui-kit';

export const file: readonly UiKit.LayoutBlock[] = [{ type: 'file', file_id: 'dummy-file-id' }] as const;

export const inputWithFileInput: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'file_input',
			filetypes: ['pdf', 'png'],
			max_files: 3,
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Attachments',
		},
	},
] as const;
