import { addAction, QuickActionsEnum } from '.';

addAction(QuickActionsEnum.MoveQueue, {
	groups: ['live'],
	id: QuickActionsEnum.MoveQueue,
	title: 'Move_queue',
	icon: 'burger-arrow-left',
	order: 1,
});

addAction(QuickActionsEnum.ChatForward, {
	groups: ['live'],
	id: QuickActionsEnum.ChatForward,
	title: 'Forward_chat',
	icon: 'balloon-arrow-top-right',
	order: 2,
});

addAction(QuickActionsEnum.Transcript, {
	groups: ['live'],
	id: QuickActionsEnum.Transcript,
	title: 'Transcript',
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
});

addAction(QuickActionsEnum.CloseChat, {
	groups: ['live'],
	id: QuickActionsEnum.CloseChat,
	title: 'Close',
	icon: 'balloon-close-top-right',
	order: 5,
	color: 'danger',
});
