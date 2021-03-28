import { useDebouncedValue, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useMemo, useState } from 'react';

import { useUserId, useUserSubscription } from '../../../../contexts/UserContext';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useUserRoom } from '../../hooks/useUserRoom';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import { useThreadsList } from './useThreadsList';

const subscriptionFields = { tunread: 1, tunreadUser: 1, tunreadGroup: 1 };
const roomFields = { t: 1, name: 1 };

export function withData(Component) {
	const WrappedComponent = ({ rid, ...props }) => {
		const userId = useUserId();
		const onClose = useTabBarClose();
		const room = useUserRoom(rid, roomFields);
		const subscription = useUserSubscription(rid, subscriptionFields);

		const [type, setType] = useLocalStorage('thread-list-type', 'all');

		const [text, setText] = useState('');
		const debouncedText = useDebouncedValue(text, 400);

		const options = useMemo(
			() => ({
				rid,
				text: debouncedText,
				type,
				tunread: subscription?.tunread,
				uid: userId,
			}),
			[rid, debouncedText, type, subscription, userId],
		);

		const { threadsList, initialItemCount, loadMoreItems } = useThreadsList(options, userId);
		const { phase, error, items: threads, itemCount: totalItemCount } = useRecordList(threadsList);

		const handleTextChange = useCallback((event) => {
			setText(event.currentTarget.value);
		}, []);

		return (
			<Component
				{...props}
				unread={subscription?.tunread}
				unreadUser={subscription?.tunreadUser}
				unreadGroup={subscription?.tunreadGroup}
				userId={userId}
				error={error}
				threads={threads}
				total={totalItemCount}
				initial={initialItemCount}
				loading={phase === AsyncStatePhase.LOADING}
				loadMoreItems={loadMoreItems}
				room={room}
				text={text}
				setText={handleTextChange}
				type={type}
				setType={setType}
				onClose={onClose}
			/>
		);
	};

	WrappedComponent.displayName = `withData(${
		Component.displayName ?? Component.name ?? 'Component'
	})`;

	return WrappedComponent;
}
