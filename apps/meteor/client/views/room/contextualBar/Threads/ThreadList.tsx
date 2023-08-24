import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput, Select, Margins, Callout, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver, useAutoFocus, useLocalStorage, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { FormEvent, ReactElement, VFC } from 'react';
import React, { useMemo, useState, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import {
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarEmptyContent,
} from '../../../../components/Contextualbar';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import type { ThreadsListOptions } from '../../../../lib/lists/ThreadsList';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import { useGoToThread } from '../../hooks/useGoToThread';
import ThreadListItem from './components/ThreadListItem';
import { useThreadsList } from './hooks/useThreadsList';

type ThreadType = 'all' | 'following' | 'unread';

const ThreadList: VFC = () => {
	const t = useTranslation();

	const { closeTab } = useRoomToolbox();

	const handleTabBarCloseButtonClick = useCallback(() => {
		closeTab();
	}, [closeTab]);

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

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
	const options: ThreadsListOptions = useDebouncedValue(
		useMemo(() => {
			if (type === 'all' || !subscribed || !uid) {
				return {
					rid,
					text,
					type: 'all',
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

	const { threadsList, loadMoreItems } = useThreadsList(options, uid);
	const { phase, error, items, itemCount } = useRecordList(threadsList);

	const goToThread = useGoToThread({ replace: true });
	const handleThreadClick = useCallback(
		(tmid: IMessage['_id']) => {
			goToThread({ rid, tmid });
		},
		[rid, goToThread],
	);

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='thread' />
				<ContextualbarTitle>{t('Threads')}</ContextualbarTitle>
				<ContextualbarClose onClick={handleTabBarCloseButtonClick} />
			</ContextualbarHeader>

			<ContextualbarContent paddingInline={0} ref={ref}>
				<Box
					display='flex'
					flexDirection='row'
					p={24}
					borderBlockEndWidth={2}
					borderBlockEndStyle='solid'
					borderBlockEndColor='extra-light'
					flexShrink={0}
				>
					<Box display='flex' flexDirection='row' flexGrow={1} mi={-4}>
						<Margins inline={4}>
							<TextInput
								placeholder={t('Search_Messages')}
								addon={<Icon name='magnifier' size='x20' />}
								ref={autoFocusRef}
								value={searchText}
								onChange={handleSearchTextChange}
							/>
							<Box w='x144'>
								<Select options={typeOptions} value={type} onChange={handleTypeChange} />
							</Box>
						</Margins>
					</Box>
				</Box>

				{phase === AsyncStatePhase.LOADING && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}

				{error && (
					<Callout mi={24} type='danger'>
						{error.toString()}
					</Callout>
				)}

				{phase !== AsyncStatePhase.LOADING && itemCount === 0 && <ContextualbarEmptyContent title={t('No_Threads')} />}

				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
					{!error && itemCount > 0 && items.length > 0 && (
						<Virtuoso
							style={{
								height: blockSize,
								width: inlineSize,
							}}
							totalCount={itemCount}
							endReached={
								phase === AsyncStatePhase.LOADING
									? (): void => undefined
									: (start): void => {
											loadMoreItems(start, Math.min(50, itemCount - start));
									  }
							}
							overscan={25}
							data={items}
							components={{ Scroller: ScrollableContentWrapper }}
							itemContent={(_index, data: IMessage): ReactElement => (
								<ThreadListItem
									thread={data}
									unread={subscription?.tunread ?? []}
									unreadUser={subscription?.tunreadUser ?? []}
									unreadGroup={subscription?.tunreadGroup ?? []}
									onClick={handleThreadClick}
								/>
							)}
						/>
					)}
				</Box>
			</ContextualbarContent>
		</>
	);
};

export default ThreadList;
