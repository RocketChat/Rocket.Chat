import { addAction, QuickActionsEnum } from '../../../../../client/views/room/lib/QuickActions';

addAction(QuickActionsEnum.OnHoldChat, {
	groups: ['live'],
	id: QuickActionsEnum.OnHoldChat,
	title: 'Livechat_onHold_Chat',
	icon: 'pause',
	order: 5,
});
