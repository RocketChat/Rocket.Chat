import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

const useThreadMessage = (tmid) => {
	const [message, setMessage] = useState(() => Tracker.nonreactive(() => ChatMessage.findOne({ _id: tmid })));
	const getMessage = useEndpoint('GET', 'chat.getMessage');

	useEffect(() => {
		const computation = Tracker.autorun(async (computation) => {
			const msg = ChatMessage.findOne({ _id: tmid }) || (await getMessage({ msgId: tmid })).message;

			if (!msg || computation.stopped) {
				return;
			}

			setMessage((prevMsg) => (prevMsg._updatedAt?.getTime() === msg._updatedAt?.getTime() ? prevMsg : msg));
		});

		return () => {
			computation.stop();
		};
	}, [getMessage, tmid]);

	return message;
};

function ThreadComponent({
	mid,
	jump,
	room,
	subscription,
}) {
	const channelRoute = useRoute(roomTypes.getConfig(room.t).route.name);
	const threadMessage = useThreadMessage(mid);

	const ref = useRef();
	const uid = useUserId();

	const headerTitle = useMemo(() => (threadMessage ? normalizeThreadTitle(threadMessage) : null), [threadMessage]);
	const [expanded, setExpand] = useLocalStorage('expand-threads', false);
	const following = threadMessage?.replies?.includes(uid) ?? false;

	const dispatchToastMessage = useToastMessageDispatch();
	const followMessage = useMethod('followMessage');
	const unfollowMessage = useMethod('unfollowMessage');

	const setFollowing = useCallback(async (following) => {
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

	useEffect(() => {
		viewDataRef.mainMessage = threadMessage;
		viewDataRef.jump = jump;
		viewDataRef.following = following;
		viewDataRef.subscription = subscription;
	}, [following, jump, subscription, threadMessage]);

	const hasThreadMessage = !!threadMessage;

	useEffect(() => {
		if (!ref.current || !hasThreadMessage) {
			return;
		}

		const view = Blaze.renderWithData(Template.thread, viewDataRef.current, ref.current);

		return () => {
			Blaze.remove(view);
		};
	}, [hasThreadMessage, mid]);

	if (!threadMessage) {
		return <ThreadSkeleton expanded={expanded} onClose={handleClose} />;
	}

	return <ThreadView
		ref={ref}
		title={headerTitle}
		expanded={expanded}
		following={following}
		onToggleExpand={(expanded) => setExpand(!expanded)}
		onToggleFollow={(following) => setFollowing(!following)}
		onClose={handleClose}
	/>;
}

export default ThreadComponent;
