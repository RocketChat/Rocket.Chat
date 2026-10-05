import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { Badge, Box, Callout, Icon, IconButton, Select, States, StatesIcon, StatesTitle, TextInput, Throbber } from '@rocket.chat/fuselage';
import { useLocalStorage, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { VirtualizedScrollbars } from '@rocket.chat/ui-client';
import { useCallback, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import ThreadsViewMainRoomItem from './ThreadsViewMainRoomItem';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';
import { getErrorMessage } from '../../../../lib/errorHandling';
import { useRoomSubscription } from '../../contexts/RoomContext';
import ThreadListItem from '../../contextualBar/Threads/components/ThreadListItem';
import { useThreadsList } from '../../contextualBar/Threads/hooks/useThreadsList';
import type { ThreadsListType } from '../../contextualBar/Threads/hooks/useThreadsListOptions';
import { useThreadsListOptions } from '../../contextualBar/Threads/hooks/useThreadsListOptions';
import { useGoToThreadsTab } from '../hooks/useGoToThreadsTab';

export type ThreadsViewListProps = {
	selectedTmid?: IMessage['_id'];
	mainRoomSelected: boolean;
	onMainRoomClick: () => void;
};

const ThreadsViewList = ({ selectedTmid, mainRoomSelected, onMainRoomClick }: ThreadsViewListProps) => {
	const { t } = useTranslation();
	const listId = useId();
	const subscription = useRoomSubscription();

	const searchId = useId();
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchText, setSearchText] = useState('');
	const focusOnMount = useCallback((input: HTMLInputElement | null) => input?.focus(), []);

	// A closed search filters nothing: what can't be seen can't be what is narrowing the list.
	const handleToggleSearch = () => {
		if (searchOpen) {
			setSearchText('');
		}
		setSearchOpen(!searchOpen);
	};

	const typeOptions: (readonly [type: ThreadsListType, label: string])[] = useMemo(
		() => [
			['all', t('All')],
			['following', t('Following')],
			['unread', t('Unread')],
		],
		[t],
	);
	const [type, setType] = useLocalStorage<ThreadsListType>('thread-list-type', 'all');

	const options = useThreadsListOptions(type, searchText);
	const { isPending, error, isSuccess, data, fetchNextPage } = useThreadsList(options);
	const items = data?.items ?? [];
	const itemCount = data?.itemCount ?? 0;

	const goToThreadsTab = useGoToThreadsTab();
	const handleThreadClick = useStableCallback((tmid: IMessage['_id']) => goToThreadsTab({ tmid }));

	return (
		<Box is='section' aria-label={t('Threads')} display='flex' flexDirection='column' width='full' height='full'>
			<Box flexShrink={0} borderBlockEndWidth='default' borderBlockEndStyle='solid' borderBlockEndColor='stroke-extra-light'>
				<ThreadsViewMainRoomItem selected={mainRoomSelected} onClick={onMainRoomClick} />
			</Box>
			<Box display='flex' alignItems='center' paddingInline={16} paddingBlock={12}>
				<Box fontScale='c2' color='hint'>
					{t('Threads')}
				</Box>
				{isSuccess && (
					<Box marginInlineStart={8}>
						<Badge variant='secondary'>{itemCount}</Badge>
					</Box>
				)}
				<Box flexGrow={1} />
				<Box width='x120'>
					<Select
						small
						aria-label={t('Filter')}
						aria-controls={isSuccess ? listId : undefined}
						options={typeOptions}
						value={type}
						onChange={(value) => {
							const option = typeOptions.find(([type]) => type === value);
							if (option) setType(option[0]);
						}}
					/>
				</Box>
				<IconButton
					small
					icon='magnifier'
					title={t('Search_Messages')}
					aria-expanded={searchOpen}
					aria-controls={searchId}
					pressed={searchOpen}
					onClick={handleToggleSearch}
					marginInlineStart={4}
				/>
			</Box>
			{searchOpen && (
				<Box id={searchId} paddingInline={16} paddingBlockEnd={12}>
					<TextInput
						ref={focusOnMount}
						small
						aria-label={t('Search_Messages')}
						aria-controls={isSuccess ? listId : undefined}
						placeholder={t('Search_Messages')}
						endAddon={<Icon name='magnifier' size='x16' />}
						value={searchText}
						onChange={(event) => setSearchText((event.currentTarget as HTMLInputElement).value)}
						onKeyDown={(event) => event.key === 'Escape' && handleToggleSearch()}
					/>
				</Box>
			)}
			<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0} overflow='hidden'>
				<ResultsLiveRegion shouldAnnounce={isSuccess} itemCount={itemCount} />
				{isPending && (
					<Box paddingInline={16} paddingBlock={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{error && (
					<Callout marginInline={16} type='danger'>
						{getErrorMessage(error, t('Something_went_wrong'))}
					</Callout>
				)}
				{isSuccess && items.length === 0 && (
					<States>
						<StatesIcon name='thread' />
						<StatesTitle>{t('No_Threads')}</StatesTitle>
					</States>
				)}
				{isSuccess && items.length > 0 && (
					<Box id={listId} width='full' height='full' overflow='hidden'>
						<VirtualizedScrollbars>
							<Virtuoso
								style={{ height: '100%', width: '100%' }}
								totalCount={itemCount}
								endReached={() => fetchNextPage()}
								overscan={25}
								data={items}
								itemContent={(_index, thread: IThreadMainMessage) => (
									<ThreadListItem
										thread={thread}
										selected={thread._id === selectedTmid}
										unread={subscription?.tunread ?? []}
										unreadUser={subscription?.tunreadUser ?? []}
										unreadGroup={subscription?.tunreadGroup ?? []}
										hasDraft={Boolean(subscription?.threadDrafts?.[thread._id])}
										onClick={handleThreadClick}
									/>
								)}
							/>
						</VirtualizedScrollbars>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default ThreadsViewList;
