import { isRoomFederated } from '@rocket.chat/core-typings';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('mentions', ({ room }) => {
	const federated = isRoomFederated(room);

	return {
		groups: ['channel', 'group', 'team'],
		id: 'mentions',
		title: 'Mentions',
		icon: 'at',
		template: 'mentionsFlexTab',
		...(federated && {
			'disabled': true,
			'data-tooltip': 'Mentions_unavailable_for_federation',
		}),
		order: 9,
	};
});
