import { useMemo } from 'react';

import type { QuickActionsActionConfig } from '../../views/room/lib/quickActions';
import { QuickActionsEnum } from '../../views/room/lib/quickActions';

export const useTranscriptQuickAction = (): QuickActionsActionConfig => {
	return useMemo(
		() => ({
			groups: ['live'],
			id: QuickActionsEnum.Transcript,
			title: 'Send_transcript',
			icon: 'mail-arrow-top-right',
			order: 3,
			options: [
				{ label: 'Send_via_email', id: QuickActionsEnum.TranscriptEmail },
				{
					label: 'Export_as_PDF',
					id: QuickActionsEnum.TranscriptPDF,
					validate: (room) => ({
						tooltip: 'Export_enabled_at_the_end_of_the_conversation',
						value: !room?.open,
					}),
				},
			],
		}),
		[],
	);
};
