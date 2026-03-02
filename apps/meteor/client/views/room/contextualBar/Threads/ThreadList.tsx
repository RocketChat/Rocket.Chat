import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput, Select, Callout, Throbber } from '@rocket.chat/fuselage';
import { useAutoFocus, useLocalStorage, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	CustomScrollbars,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarEmptyContent,
	ContextualbarSection,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useTranslation, useUserId, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FormEvent } from 'react';
import { useMemo, useState, useCallback, useEffect } from 'react';

import ThreadListItem from './components/ThreadListItem';
import { useThreadsList } from './hooks/useThreadsList';
import { getErrorMessage } from '../../../../lib/errorHandling';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useGoToThread } from '../../hooks/useGoToThread';

type ThreadType = 'all' | 'following' | 'unread';

const ThreadList = () => {
	const t = useTranslation();

	const { closeTab } = useRoomToolbox();

	const handleTabBarCloseButtonClick = useCallback(() => {
		closeTab();
	}, [closeTab]);

	const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

	const autoFocusRef = useAutoFocus<HTMLInputElement>(true);

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

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => scrollElement,
		estimateSize: () => 96,
		overscan: 25,
	});

	const virtualItems = virtualizer.getVirtualItems();
	const lastItem = virtualItems[virtualItems.length - 1];

	useEffect(() => {
		if (lastItem && lastItem.index >= items.length - 1 && items.length < itemCount) {
			fetchNextPage();
		}
	}, [lastItem, items.length, itemCount, fetchNextPage]);

	const goToThread = useGoToThread({ replace: true });
	const handleThreadClick = useCallback(
		(tmid: IMessage['_id']) => {
			goToThread({ rid, tmid });
		},
		[rid, goToThread],
	);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='thread' />
				<ContextualbarTitle>{t('Threads')}</ContextualbarTitle>
				<ContextualbarClose onClick={handleTabBarCloseButtonClick} />
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					placeholder={t('Search_Messages')}
					addon={<Icon name='magnifier' size='x20' />}
					ref={autoFocusRef}
					value={searchText}
					onChange={handleSearchTextChange}
				/>
				<Box w='x144' mis={8}>
					<Select options={typeOptions} value={type} onChange={(value) => handleTypeChange(String(value))} />
				</Box>
			</ContextualbarSection>
			<ContextualbarContent paddingInline={0}>
				{isPending && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}

				{error && (
					<Callout mi={24} type='danger'>
						{getErrorMessage(error, t('Something_went_wrong'))}
					</Callout>
				)}

				{isSuccess && itemCount === 0 && <ContextualbarEmptyContent title={t('No_Threads')} />}

				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
					{!error && itemCount > 0 && items.length > 0 && (
						<CustomScrollbars ref={setScrollElement}>
							<div
								style={{
									height: virtualizer.getTotalSize(),
									width: '100%',
									position: 'relative',
								}}
							>
								{virtualItems.map((virtualRow) => {
									const thread = items[virtualRow.index];
									return (
										<div
											key={virtualRow.key}
											data-index={virtualRow.index}
											ref={virtualizer.measureElement}
											style={{
												position: 'absolute',
												top: 0,
												left: 0,
												width: '100%',
												transform: `translateY(${virtualRow.start}px)`,
											}}
										>
											<ThreadListItem
												thread={thread}
												unread={subscription?.tunread ?? []}
												unreadUser={subscription?.tunreadUser ?? []}
												unreadGroup={subscription?.tunreadGroup ?? []}
												onClick={handleThreadClick}
											/>
										</div>
									);
								})}
							</div>
						</CustomScrollbars>
					)}
				</Box>
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default ThreadList;
