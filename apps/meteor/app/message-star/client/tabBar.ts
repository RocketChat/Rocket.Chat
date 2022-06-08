import { isIRoomFederated } from '@rocket.chat/core-typings';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('starred-messages', ({ room }) => ({
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
	id: 'starred-messages',
	title: 'Starred_Messages',
	icon: 'star',
	// hint/tooltip/description/label:  ...isIRoomFederated(room) && {label: 'bla blab la'}
	template: 'starredMessages',
	disabled: isIRoomFederated(room),
	order: 10,
}));
