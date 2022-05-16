import type { IRoom } from '@rocket.chat/core-typings';
import { useRoute, useUserSubscription } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import React, { useEffect, useRef, useState, useCallback, useMemo, FC } from 'react';

import { normalizeThreadTitle } from '../../../../app/threads/client/lib/normalizeThreadTitle';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { useTabBarOpenUserInfo } from '../providers/ToolboxProvider';
import ThreadSkeleton from './ThreadSkeleton';
import ThreadView from './ThreadView';
import { useThreadExpansion } from './useThreadExpansion';
import { useThreadFollowing } from './useThreadFollowing';
import { useThreadMessage } from './useThreadMessage';

const subscriptionFields = {};

const ThreadComponent: FC<{
	mid: string;
	jump: unknown;
	room: IRoom;
	onClickBack: (e: unknown) => void;
}> = ({ mid, jump, room, onClickBack }) => {
	const subscription = useUserSubscription(room._id, subscriptionFields);
	const channelRoute = useRoute(roomCoordinator.getRoomTypeConfig(room.t).route.name);
	const threadMessage = useThreadMessage(mid);

	const openUserInfo = useTabBarOpenUserInfo();

	const ref = useRef<HTMLElement>(null);

	const headerTitle: string | null = useMemo(() => (threadMessage ? normalizeThreadTitle(threadMessage) : null), [threadMessage]);
	const [canExpand, expanded, toggleExpanded] = useThreadExpansion();
	const [following, toggleFollowing] = useThreadFollowing(mid);

	const handleClose = useCallback(() => {
		channelRoute.push(room.t === 'd' ? { rid: room._id } : { name: room.name || room._id });
	}, [channelRoute, room._id, room.t, room.name]);

	const [viewData, setViewData] = useState(() => ({
		mainMessage: threadMessage,
		jump,
		following,
		subscription,
		rid: room._id,
		tabBar: { openUserInfo },
	}));

	useEffect(() => {
		setViewData((viewData) => {
			if (!threadMessage || viewData.mainMessage?._id === threadMessage._id) {
				return viewData;
			}

			return {
				mainMessage: threadMessage,
				jump,
				following,
				subscription,
				rid: room._id,
				tabBar: { openUserInfo },
			};
		});
	}, [following, jump, openUserInfo, room._id, subscription, threadMessage]);

	useEffect(() => {
		if (!ref.current || !viewData.mainMessage) {
			return;
		}
		const view = Blaze.renderWithData(Template.thread, viewData, ref.current);

		return (): void => {
			Blaze.remove(view);
		};
	}, [viewData]);

	if (!threadMessage) {
		return <ThreadSkeleton expanded={canExpand && expanded} onClose={handleClose} />;
	}

	return (
		<ThreadView
			ref={ref}
			title={headerTitle}
			canExpand={canExpand}
			expanded={expanded}
			following={following}
			onToggleExpand={toggleExpanded}
			onToggleFollow={toggleFollowing}
			onClose={handleClose}
			onClickBack={onClickBack}
		/>
	);
};

export default ThreadComponent;
