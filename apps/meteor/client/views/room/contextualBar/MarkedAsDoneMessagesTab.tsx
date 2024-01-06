import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useSetModal, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback } from 'react';

import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';
import MessageListTab from './MessageListTab';
import { ContextualbarFooter } from '/client/components/Contextualbar';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import GenericModal from '/client/components/GenericModal';
import { dispatchToastMessage } from '/client/lib/toast';
import { queryClient } from '/client/lib/queryClient';



const MarkedAsDoneMessagesTab = () => {
	const setModal = useSetModal();
	const closeModal = useCallback(() => setModal(null), [setModal]);
	const markAllAsDoneAction = useEndpoint('POST', '/v1/rooms.markAllMessagesAsDone');
	const getMarkedAsDoneMessages = useEndpoint('GET', '/v1/chat.getMarkedAsDoneMessages'); // TODO

	const room = useRoom();
	const userId = useUserId();
	const handleMarkAllAsDone = useMutableCallback((): void => {
		const handleMarkAllAsDoneAction = async () => {
			try {
				if (!userId) {
					throw new Error("Missing user id");
				}
				await markAllAsDoneAction({
					roomId: room._id,
					userId: userId
				});

				dispatchToastMessage({ type: 'success', message: "Marked all messages as Done" });
				queryClient.invalidateQueries(['rooms', room._id, 'marked-as-done-messages']);
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		return setModal(
			<GenericModal
				variant='danger'
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={handleMarkAllAsDoneAction}
				confirmText={"Mark all messages as Done"}
			>
				{"Mark all messages as Done"}
			</GenericModal>,
		);
	});



	const markedAsDoneMessagesQueryResult = useQuery(['rooms', room._id, 'marked-as-done-messages'] as const, async () => {
		const messages: IMessage[] = [];

		for (
			let offset = 0, result = await getMarkedAsDoneMessages({ roomId: room._id, offset: 0 });
			result.count > 0;
			// eslint-disable-next-line no-await-in-loop
			offset += result.count, result = await getMarkedAsDoneMessages({ roomId: room._id, offset })
		) {
			messages.push(...result.messages.map(mapMessageFromApi));
		}

		return messages;
	});

	return (
		<>
		<MessageListTab
			iconName='checkmark-circled'
			title={"Messages marked as done"}
			emptyResultMessage={"No messages marked as done"}
			context='message' // TODO
			queryResult={markedAsDoneMessagesQueryResult}
		/>
		<ContextualbarFooter>
			<ButtonGroup stretch>
				<Button danger onClick={handleMarkAllAsDone}>
					{"Mark all as Done"}
				</Button>
			</ButtonGroup>
		</ContextualbarFooter>
		</>
	);
};

export default MarkedAsDoneMessagesTab;
