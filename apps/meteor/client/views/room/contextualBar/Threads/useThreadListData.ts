import type { IMessage, ISubscription, IThreadMainMessage } from '@rocket.chat/core-typings';
import { useLocalStorage, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useUserId, useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import { useMemo, useState, useCallback } from 'react';

import { useThreadsList } from './hooks/useThreadsList';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useGoToThread } from '../../hooks/useGoToThread';

type ThreadType = 'all' | 'following' | 'unread';

export type ThreadListData = {
	searchText: string;
	handleSearchTextChange: (event: FormEvent<HTMLInputElement>) => void;
	typeOptions: (readonly [type: ThreadType, label: string])[];
	type: ThreadType;
	handleTypeChange: (type: string) => void;
	handleTabBarCloseButtonClick: () => void;
	isPending: boolean;
	error: Error | null;
	isSuccess: boolean;
	items: IThreadMainMessage[];
	itemCount: number;
	fetchNextPage: () => void;
	handleThreadClick: (tmid: IMessage['_id']) => void;
	subscription: ISubscription | undefined;
};

export const useThreadListData = (): ThreadListData => {
	const t = useTranslation();
	const { closeTab } = useRoomToolbox();

	const handleTabBarCloseButtonClick = useCallback(() => {
		closeTab();
	}, [closeTab]);

	const [searchText, setSearchText] = useState('');

	const handleSearchTextChange = useCallback(
		(event: FormEvent<HTMLInputElement>) => {
			setSearchText(event.currentTarget.value);
		},
		[setSearchText],
	);

	const typeOptions: (readonly [type: ThreadType, label: string])[] = useMemo(
		() => [
			['all', t('All')],
			['following', t('Following')],
			['unread', t('Unread')],
		],
		[t],
	);

	const [type, setType] = useLocalStorage<ThreadType>('thread-list-type', 'all');

	const handleTypeChange = useCallback(
		(type: string) => {
			const typeOption = typeOptions.find(([t]) => t === type);
			if (typeOption) setType(typeOption[0]);
		},
		[setType, typeOptions],
	);

	const room = useRoom();
	const rid = room._id;
	const subscription = useRoomSubscription();
	const subscribed = !!subscription;
	const uid = useUserId();
	const tunread = subscription?.tunread?.sort().join(',');
	const text = useDebouncedValue(searchText, 400);
	const options = useDebouncedValue(
		useMemo(() => {
			if (type === 'all' || !subscribed || !uid) {
				return {
					rid,
					text,
				};
			}
			switch (type) {
				case 'following':
					return {
						rid,
						text,
						type,
						uid,
					};
				case 'unread':
					return {
						rid,
						text,
						type,
						tunread: tunread?.split(','),
					};
			}
		}, [rid, subscribed, text, tunread, type, uid]),
		300,
	);

	const { isPending, error, isSuccess, data, fetchNextPage } = useThreadsList(options);

	const items = data?.items || [];
	const itemCount = data?.itemCount ?? 0;

	const goToThread = useGoToThread({ replace: true });
	const handleThreadClick = useCallback(
		(tmid: IMessage['_id']) => {
			goToThread({ rid, tmid });
		},
		[rid, goToThread],
	);

	return {
		searchText,
		handleSearchTextChange,
		typeOptions,
		type,
		handleTypeChange,
		handleTabBarCloseButtonClick,
		isPending,
		error,
		isSuccess,
		items,
		itemCount,
		fetchNextPage,
		handleThreadClick,
		subscription,
	};
};
