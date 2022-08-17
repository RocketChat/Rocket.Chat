import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useUserId, useUserRoom, useUserSubscription } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, useState } from 'react';

import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import { useDiscussionsList } from './useDiscussionsList';

const subscriptionFields = { tunread: 1, tunreadUser: 1, tunreadGroup: 1 };
const roomFields = { t: 1, name: 1 };

export function withData(Component) {
	const WrappedComponent = ({ rid, ...props }) => {
		const room = useUserRoom(rid, roomFields);
		const subscription = useUserSubscription(rid, subscriptionFields);
		const userId = useUserId();
		const onClose = useTabBarClose();

		const [text, setText] = useState('');
		const debouncedText = useDebouncedValue(text, 400);

		const options = useMemo(
			() => ({
				rid,
				text: debouncedText,
			}),
			[rid, debouncedText],
		);

		const { discussionsList, initialItemCount, loadMoreItems } = useDiscussionsList(options, userId);
		const { phase, error, items: discussions, itemCount: totalItemCount } = useRecordList(discussionsList);

		const handleTextChange = useCallback((e) => {
			setText(e.currentTarget.value);
		}, []);

		return (
			<Component
				{...props}
				onClose={onClose}
				unread={subscription?.tunread}
				unreadUser={subscription?.tunreadUser}
				unreadGroup={subscription?.tunreadGroup}
				userId={userId}
				error={error}
				discussions={discussions}
				total={totalItemCount}
				initial={initialItemCount}
				loading={phase === AsyncStatePhase.LOADING}
				loadMoreItems={loadMoreItems}
				room={room}
				text={text}
				setText={handleTextChange}
			/>
		);
	};

	WrappedComponent.displayName = `withData(${Component.displayName ?? Component.name ?? 'Component'})`;

	return WrappedComponent;
}
