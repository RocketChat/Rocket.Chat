import { addAction, QuickActionsEnum } from '../../../../../client/views/room/lib/QuickActions';

addAction(QuickActionsEnum.OnHoldChat, {
	groups: ['live'],
	id: QuickActionsEnum.OnHoldChat,
	title: 'Omnichannel_onHold_Chat',
	icon: 'pause-unfilled',
	order: 4,
});
