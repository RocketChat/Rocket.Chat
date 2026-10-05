import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithDateTimePicker: readonly LayoutBlock[] = [
	{
		type: 'actions',
		elements: [
			{
				type: 'datetimepicker',
				initialDateTime: 1791216000,
				appId: 'app-id',
				blockId: 'block-id',
				actionId: 'action-id',
			},
		],
	},
];
