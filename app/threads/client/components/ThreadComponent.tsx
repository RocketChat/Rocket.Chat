import React, { useEffect, useRef, useState, useCallback, useMemo, FC } from 'react';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { Tracker } from 'meteor/tracker';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';

import { ChatMessage } from '../../../models/client';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { roomTypes } from '../../../utils/client';
import { normalizeThreadTitle } from '../lib/normalizeThreadTitle';
import { useUserId } from '../../../../client/contexts/UserContext';
import { useEndpoint, useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import ThreadSkeleton from './ThreadSkeleton';
import ThreadView from './ThreadView';
import { IMessage } from '../../../../definition/IMessage';
import { IRoom } from '../../../../definition/IRoom';

const useThreadMessage = (tmid: string): IMessage => {
	const [message, setMessage] = useState<IMessage>(() => Tracker.nonreactive(() => ChatMessage.findOne({ _id: tmid })));
	const getMessage = useEndpoint('GET', 'chat.getMessage');
	const getMessageParsed = useCallback<(params: Mongo.Query<IMessage>) => Promise<IMessage>>(async (params) => {
		const { message } = await getMessage(params);
		return {
			...message,
			_updatedAt: new Date(message._updatedAt),
		};
	}, [getMessage]);

	useEffect(() => {
		const computation = Tracker.autorun(async (computation) => {
			const msg = ChatMessage.findOne({ _id: tmid }) || await getMessageParsed({ msgId: tmid });

			if (!msg || computation.stopped) {
				return;
			}

			setMessage((prevMsg) => {
				if (!prevMsg || prevMsg._id !== msg._id || prevMsg._updatedAt?.getTime() !== msg._updatedAt?.getTime()) {
					return msg;
				}

				return prevMsg;
			});
		});

		return (): void => {
			computation.stop();
		};
	}, [getMessageParsed, tmid]);

	return message;
};

const ThreadComponent: FC<{
	mid: string;
	jump: unknown;
	room: IRoom;
	subscription: unknown;
}> = ({
	mid,
	jump,
	room,
	subscription,
}) => {
	const channelRoute = useRoute(roomTypes.getConfig(room.t).route.name);
	const threadMessage = useThreadMessage(mid);

	const ref = useRef<Element>(null);
	const uid = useUserId();

	const headerTitle = useMemo(() => (threadMessage ? normalizeThreadTitle(threadMessage) : null), [threadMessage]);
	const [expanded, setExpand] = useLocalStorage('expand-threads', false);
	const following = !uid ? false : threadMessage?.replies?.includes(uid) ?? false;

	const dispatchToastMessage = useToastMessageDispatch();
	const followMessage = useMethod('followMessage');
	const unfollowMessage = useMethod('unfollowMessage');

	const setFollowing = useCallback<(following: boolean) => void>(async (following) => {
		try {
			if (following) {
				await followMessage({ mid });
				return;
			}

			await unfollowMessage({ mid });
		} catch (error) {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		}
	}, [dispatchToastMessage, followMessage, unfollowMessage, mid]);

	const handleClose = useCallback(() => {
		channelRoute.push(room.t === 'd' ? { rid: room._id } : { name: room.name });
	}, [channelRoute, room._id, room.t, room.name]);

	const viewDataRef = useRef({
		mainMessage: threadMessage,
		jump,
		following,
		subscription,
	});
	viewDataRef.current.mainMessage = threadMessage;
	viewDataRef.current.jump = jump;
	viewDataRef.current.following = following;
	viewDataRef.current.subscription = subscription;

	useEffect(() => {
		if (!ref.current || !viewDataRef.current.mainMessage) {
			return;
		}

		const view = Blaze.renderWithData(Template.thread, viewDataRef.current, ref.current);

		return (): void => {
			Blaze.remove(view);
		};
	}, [mid]);

	if (!threadMessage) {
		return <ThreadSkeleton expanded={expanded} onClose={handleClose} />;
	}

	return <ThreadView
		ref={ref}
		title={headerTitle}
		expanded={expanded}
		following={following}
		onToggleExpand={(expanded): void => setExpand(!expanded)}
		onToggleFollow={(following): void => setFollowing(!following)}
		onClose={handleClose}
	/>;
};

export default ThreadComponent;
