import { useMutation, useQuery } from '@tanstack/react-query';
import { Box, Throbber } from '@rocket.chat/fuselage';
import React, { useCallback, useEffect, useState } from 'react';

import Composer from './Composer';
import Header from './Header';
import MessageList from './MessageList';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useUserRoomSubscription } from '../hooks/useUserRoomSubscription';

export default function Room({ id: rid }: { id: string }) {
	const roomDataSubscription = useUserRoomSubscription(rid);

	const sendMessageEndpoint = useEndpoint('POST', '/v1/chat.sendMessage');

	const sendMessage = useMutation(async (msg: string) => {
		sendMessageEndpoint({ message: { rid: rid, msg } });
	});

	if (roomDataSubscription.status === 'loading') {
		return (
			<Box flexGrow={1} flexShrink={1} flexDirection='column' display='flex' justifyContent='center'>
				<Box display='flex' flexDirection='column' justifyContent='center' height='full'>
					<Throbber size='x32' />
				</Box>
			</Box>
		);
	}

	if (roomDataSubscription.status === 'error') {
		return <>Error...</>;
	}

	const { subscription } = roomDataSubscription.data;

	if (!subscription) {
		return <>Error...</>;
	}

	return (
		<Box flexGrow={1} flexShrink={1} flexDirection='column' display='flex'>
			<Header># {subscription.fname || subscription.name}</Header>
			<MessageList roomId={rid} />
			<Composer onSend={(msg) => sendMessage.mutateAsync(msg)} />
		</Box>
	);
}
