import type { IMessage } from '@rocket.chat/core-typings';

import { Rooms, Subscriptions, Messages } from '../../../stores';
import { sdk } from '../../SDKClient';
import { emoji } from '../../emoji';
import { roomCoordinator } from '../../rooms/roomCoordinator';
import { dispatchToastMessage } from '../../toast';
import { getUser, getUserId } from '../../user';
import type { ChatAPI } from '../ChatAPI';
import { processSetReactionCore } from '../core/processSetReaction';

export const processSetReaction = (chat: ChatAPI, message: Pick<IMessage, 'msg'>): Promise<boolean> =>
	processSetReactionCore(
		{
			getUserId: () => getUserId(),
			getUser: () => getUser(),
			getMessage: (id) => Messages.state.get(id),
			getRoom: (rid) => Rooms.state.get(rid),
			hasSubscription: (rid) => !!Subscriptions.state.find(({ rid: subscriptionRid }) => subscriptionRid === rid),
			emojiExists: (shortcode) => !!emoji.list[shortcode],
			isReadOnly: (room, user) => roomCoordinator.readOnly(room, user),
			updateMessage: (predicate, modifier) => Messages.state.update(predicate, modifier),
			postReaction: (params) => sdk.rest.post('/v1/chat.react', params),
			notifyError: (error) => dispatchToastMessage({ type: 'error', message: error }),
		},
		chat,
		message,
	);
