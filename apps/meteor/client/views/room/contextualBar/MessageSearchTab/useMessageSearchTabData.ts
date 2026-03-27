import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useRoomToolbox, useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction } from 'react';
import { useState, useCallback } from 'react';

import { useMessageSearchProviderQuery } from './hooks/useMessageSearchProviderQuery';
import { useMessageSearchQuery } from './hooks/useMessageSearchQuery';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useRoomSubscription } from '../../contexts/RoomContext';

export type MessageSearchTabData = {
	closeTab: () => void;
	subscription: ISubscription | undefined;
	showUserAvatar: boolean;
	providerQuery: ReturnType<typeof useMessageSearchProviderQuery>;
	searchText: string;
	globalSearch: boolean;
	handleSearch: Dispatch<SetStateAction<{ searchText: string; globalSearch: boolean }>>;
	isSuccess: boolean;
	isPending: boolean;
	messageSearchData: IMessage[] | undefined;
	itemCount: number;
	handleLoadMore: () => void;
	formatDate: ReturnType<typeof useFormatDate>;
};

export const useMessageSearchTabData = (): MessageSearchTabData => {
	const { closeTab } = useRoomToolbox();
	const pageSize = useSetting('PageSize', 10);

	const [limit, setLimit] = useState(pageSize);
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');

	const providerQuery = useMessageSearchProviderQuery();

	const [{ searchText, globalSearch }, handleSearch] = useState({ searchText: '', globalSearch: false });
	const { isSuccess, data: messageSearchData, isPending } = useMessageSearchQuery({ searchText, limit, globalSearch });
	const itemCount = messageSearchData?.length ?? 0;
	const formatDate = useFormatDate();

	const handleLoadMore = useCallback(() => {
		setLimit((prev) => prev + pageSize);
	}, [pageSize]);

	return {
		closeTab,
		subscription,
		showUserAvatar,
		providerQuery,
		searchText,
		globalSearch,
		handleSearch,
		isSuccess,
		isPending,
		messageSearchData,
		itemCount,
		handleLoadMore,
		formatDate,
	};
};
