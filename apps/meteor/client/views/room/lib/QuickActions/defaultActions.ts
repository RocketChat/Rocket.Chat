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
});

addAction(QuickActionsEnum.CloseChat, {
	groups: ['live'],
	id: QuickActionsEnum.CloseChat,
	title: 'Close',
	icon: 'balloon-close-top-right',
	order: 5,
	color: 'danger',
});
