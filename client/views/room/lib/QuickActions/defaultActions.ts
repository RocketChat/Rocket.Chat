import { addAction, QuickActionsEnum } from '.';


addAction(QuickActionsEnum.MoveQueue, {
	groups: ['channel'],
	id: QuickActionsEnum.MoveQueue,
	title: 'Move_queue',
	icon: 'burger-arrow-left',
	order: 1,
});

addAction(QuickActionsEnum.ChatForward, {
	groups: ['channel'],
	id: QuickActionsEnum.ChatForward,
	title: 'Forward_chat',
	icon: 'baloon-arrow-top-right',
	order: 2,
});

addAction(QuickActionsEnum.Transcript, {
	groups: ['channel'],
	id: QuickActionsEnum.Transcript,
	title: 'Transcript',
	icon: 'mail-arrow-top-right',
	order: 3,
});

addAction(QuickActionsEnum.CloseChat, {
	groups: ['channel'],
	id: QuickActionsEnum.CloseChat,
	title: 'Close',
	icon: 'baloon-close-top-right',
	order: 4,
	color: 'danger',
});
