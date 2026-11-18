import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { Random } from '@rocket.chat/random';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';

import { getPermaLinkFromMessage } from '../../../lib/getPermaLink';
import { Messages } from '../../../stores';
import { useGetMessageByID } from '../../../views/room/contextualBar/Threads/hooks/useGetMessageByID';
import ForwardMessageModal from '../../../views/room/modals/ForwardMessageModal';
import type { DMRecipient } from '../../../views/room/modals/ForwardMessageModal/ForwardMessageModal';

const isDMRecipient = (mention: unknown): mention is DMRecipient =>
	typeof mention === 'object' && mention !== null && '_id' in mention && 'username' in mention && typeof mention.username === 'string';

const parseRecipients = (value: unknown): DMRecipient[] => {
	const mentions: unknown = JSON.parse(String(value));
	return Array.isArray(mentions) ? mentions.filter(isDMRecipient) : [];
};

export const useForwardToMentionedUsers = (rid: IRoom['_id'], mid: IMessage['_id']) => {
	const setModal = useSetModal();
	const getMessage = useGetMessageByID(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const sendInteraction = useEndpoint('POST', '/apps/ui.interaction/:id', { id: 'mention-core' });

	return useStableCallback(async (messageId: IMessage['_id'], stringifiedMentions: unknown) => {
		try {
			const users = parseRecipients(stringifiedMentions);
			const message = Messages.state.get(messageId) ?? (await getMessage(messageId));
			const permalink = await getPermaLinkFromMessage(message);

			const forward = (selected: DMRecipient[]) =>
				sendInteraction({
					type: 'blockAction',
					actionId: 'share-message',
					payload: {
						blockId: messageId,
						value: JSON.stringify(selected),
					},
					container: {
						type: 'message',
						id: mid,
					},
					rid,
					mid,
					triggerId: Random.id(),
				});

			setModal(
				<ForwardMessageModal message={message} permalink={permalink} dmRecipients={{ users, forward }} onClose={() => setModal(null)} />,
			);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});
};
