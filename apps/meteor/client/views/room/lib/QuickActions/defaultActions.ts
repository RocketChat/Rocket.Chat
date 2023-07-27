import { addAction, QuickActionsEnum } from '.';

addAction(QuickActionsEnum.CloseChat, {
	groups: ['live'],
	id: QuickActionsEnum.CloseChat,
	title: 'End_conversation',
	icon: 'balloon-close-top-right',
	order: 5,
	color: 'danger',
});
