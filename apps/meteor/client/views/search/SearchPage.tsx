/* eslint-disable react/no-multi-comp */
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Callout, Icon, Tag, Tabs, TabsItem, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { RoomAvatar, UserAvatar } from '@rocket.chat/ui-avatar';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useRouter, useSearchParameter, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ChangeEvent, ReactElement, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type SearchTab = 'all' | 'messages' | 'users' | 'rooms';

type SearchUser = Pick<Required<IUser>, 'name' | 'status' | '_id' | 'username'> & Partial<Pick<IUser, 'statusText' | 'avatarETag'>>;

type SearchRoom = Pick<Required<IRoom>, 't' | 'name' | '_id'> & Partial<Pick<IRoom, 'fname'>>;

type SearchMessageLike = {
	_id: string;
	rid?: string;
	msg?: string;
	msgId?: string;
	text?: string;
	score?: number;
	ts?: Date | string;
	u?: Pick<IMessage['u'], 'username' | 'name'>;
	room?: Pick<IRoom, '_id' | 't' | 'name' | 'fname'>;
};

type SearchFilterDraft = {
	rid?: string;
	roomName: string;
	fromUser: string;
	afterDate: string;
	beforeDate: string;
};

type CombinedMessageResult = {
	item: SearchMessageLike;
	isIntelligent: boolean;
};

const tabs: SearchTab[] = ['all', 'messages', 'users', 'rooms'];
const roomLookupOptions = { limit: 20, sort: { lm: -1, name: 1 } } as const;

const getValidTab = (tab?: string | null): SearchTab => (tabs.includes(tab as SearchTab) ? (tab as SearchTab) : 'all');

const mapSubscriptionToSearchRoom = ({ rid, _id, t, name, fname }: SubscriptionWithRoom): SearchRoom => ({
	_id: rid || _id,
	t,
	name,
	fname,
});

const mergeRooms = (localRooms: SearchRoom[], remoteRooms: SearchRoom[]): SearchRoom[] => {
	const rooms = new Map<string, SearchRoom>();
	for (const room of [...localRooms, ...remoteRooms]) {
		rooms.set(room._id, room);
	}
	return [...rooms.values()];
};

const getMessageIdentity = (item: SearchMessageLike): string => item.msgId || item._id;

const mergeMessageResults = (
	messages: SearchMessageLike[],
	intelligent: SearchMessageLike[],
	includeIntelligent: boolean,
): CombinedMessageResult[] => {
	const results = new Map<string, CombinedMessageResult>();
	for (const item of messages) {
		results.set(getMessageIdentity(item), { item, isIntelligent: false });
	}
	if (includeIntelligent) {
		for (const item of intelligent) {
			const identity = getMessageIdentity(item);
			if (!results.has(identity)) {
				results.set(identity, { item, isIntelligent: true });
			}
		}
	}
	return [...results.values()];
};

const getMessageRoom = (item: SearchMessageLike): Pick<IRoom, '_id' | 't' | 'name' | 'fname'> | undefined => item.room;
const getMessageId = (item: SearchMessageLike): string => item.msgId || item._id;

const getMessageHref = (item: SearchMessageLike): string | undefined => {
	const room = getMessageRoom(item);
	const rid = 'rid' in item ? item.rid : undefined;
	const href = roomCoordinator.getRouteLink(room?.t || 'c', {
		rid: room?._id || rid,
		name: room?.name,
	});
	if (!href) return undefined;
	return `${href}?msg=${encodeURIComponent(getMessageId(item))}`;
};

const formatMessageTime = (ts: Date | string | undefined): string => {
	if (!ts) return '';
	const date = new Date(ts);
	if (Number.isNaN(date.getTime())) return '';
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / 86400000);
	if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
	return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const SearchResultLink = ({
	href,
	icon,
	title,
	subtitle,
	meta,
}: {
	href?: string;
	icon: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	meta?: ReactNode;
}): ReactElement => (
	<Box is={href ? 'a' : 'div'} href={href} display='flex' alignItems='center' p={12} color='default' style={{ textDecoration: 'none' }}>
		<Box mie={12} flexShrink={0}>
			{icon}
		</Box>
		<Box flexGrow={1} minWidth={0}>
			<Box fontScale='p2m' withTruncatedText>
				{title}
			</Box>
			{subtitle && (
				<Box color='hint' fontScale='c1' withTruncatedText>
					{subtitle}
				</Box>
			)}
		</Box>
		{meta && (
			<Box mis={12} flexShrink={0}>
				{meta}
			</Box>
		)}
	</Box>
);

/** Richer card for message results — shows avatar, sender, room, and timestamp */
const MessageResultItem = ({
	item,
	href,
	isIntelligent,
}: {
	item: SearchMessageLike;
	href?: string;
	isIntelligent?: boolean;
}): ReactElement => {
	const { t } = useTranslation();
	const username = item.u?.username;
	const roomLabel = item.room?.fname || item.room?.name;
	const text = ('text' in item ? item.text : undefined) || item.msg || '';
	const time = formatMessageTime(item.ts);

	return (
		<Box
			is={href ? 'a' : 'div'}
			href={href}
			display='flex'
			alignItems='flex-start'
			p={12}
			color='default'
			style={{ textDecoration: 'none', gap: 12 }}
			className='rcx-box--hover'
		>
			<Box flexShrink={0} mbs={2}>
				{username ? (
					<UserAvatar size='x28' username={username} />
				) : (
					<Box width='x28' height='x28' display='flex' alignItems='center' justifyContent='center' bg='surface-neutral' borderRadius='full'>
						<Icon name={isIntelligent ? 'stars' : 'post'} size='x16' color='hint' />
					</Box>
				)}
			</Box>
			<Box flexGrow={1} minWidth={0}>
				<Box display='flex' alignItems='center' justifyContent='space-between' mbe={2} style={{ gap: 8 }}>
					<Box display='flex' alignItems='center' style={{ gap: 6 }} flexShrink={1} minWidth={0}>
						{username && (
							<Box fontScale='p2m' withTruncatedText flexShrink={0}>
								{item.u?.name || username}
							</Box>
						)}
						{roomLabel && (
							<Box display='flex' alignItems='center' color='hint' fontScale='c1' style={{ gap: 2 }} flexShrink={1} minWidth={0}>
								<Icon name='hash' size='x12' />
								<Box withTruncatedText>{roomLabel}</Box>
							</Box>
						)}
					</Box>
					<Box display='flex' alignItems='center' flexShrink={0} style={{ gap: 6 }}>
						<Tag>{isIntelligent ? t('Intelligent_Search') : t('Messages')}</Tag>
						{isIntelligent && typeof item.score === 'number' && <Tag>{Math.round(item.score * 100)}%</Tag>}
						{time && (
							<Box color='hint' fontScale='c1' style={{ whiteSpace: 'nowrap' }}>
								{time}
							</Box>
						)}
					</Box>
				</Box>
				<Box
					fontScale='p2'
					color='default'
					style={{
						lineHeight: '1.4',
						wordBreak: 'break-word',
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
					}}
				>
					{text || <Box color='hint'>—</Box>}
				</Box>
			</Box>
		</Box>
	);
};

const EmptySearchState = ({ children }: { children: ReactNode }): ReactElement => (
	<Box display='flex' justifyContent='center' color='hint' fontScale='p2' p={24}>
		{children}
	</Box>
);

const Section = ({
	title,
	count,
	children,
	showHeader = true,
}: {
	title: string;
	count: number;
	children: ReactNode;
	showHeader?: boolean;
}): ReactElement | null => {
	if (count === 0) return null;
	return (
		<Box mbe={24}>
			{showHeader && (
				<Box display='flex' alignItems='center' mbe={8}>
					<Box is='h2' fontScale='h4' mie={8}>
						{title}
					</Box>
					<Tag>{count}</Tag>
				</Box>
			)}
			<Box border='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)' borderRadius={4} overflow='hidden'>
				{children}
			</Box>
		</Box>
	);
};

const SearchFilterPanel = ({
	draft,
	roomSuggestions,
	onDraftChange,
	onSelectRoom,
	onApply,
	onClear,
}: {
	draft: SearchFilterDraft;
	roomSuggestions: SearchRoom[];
	onDraftChange: (nextDraft: SearchFilterDraft) => void;
	onSelectRoom: (room: SearchRoom) => void;
	onApply: () => void;
	onClear: () => void;
}): ReactElement => {
	const { t } = useTranslation();
	const updateDraft = (key: keyof SearchFilterDraft) => (event: ChangeEvent<HTMLInputElement>) => {
		onDraftChange({
			...draft,
			[key]: event.currentTarget.value,
			...(key === 'roomName' && { rid: undefined }),
		});
	};

	return (
		<Box
			display='flex'
			flexDirection='column'
			p={16}
			mbe={16}
			border='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'
			borderRadius={4}
			bg='surface-light'
			style={{ gap: 12 }}
		>
			<Box display='flex' alignItems='center' justifyContent='space-between' style={{ gap: 12 }}>
				<Box display='flex' alignItems='center' fontScale='p2m' style={{ gap: 6 }}>
					<Icon name='sort' size='x16' />
					{t('Search_filters')}
				</Box>
				<ButtonGroup>
					<Button small onClick={onClear}>
						{t('Search_clear_filters')}
					</Button>
					<Button small primary onClick={onApply}>
						{t('Apply')}
					</Button>
				</ButtonGroup>
			</Box>
			<Box display='grid' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
				<Box>
					<Box fontScale='c1' color='hint' mbe={4}>
						{t('Search_filter_in_room')}
					</Box>
					<TextInput
						value={draft.roomName}
						placeholder={t('Search_filter_room_placeholder')}
						onChange={updateDraft('roomName')}
						addon={<Icon name='hash' size='x16' />}
					/>
				</Box>
				<Box>
					<Box fontScale='c1' color='hint' mbe={4}>
						{t('Search_filter_from_user')}
					</Box>
					<TextInput
						value={draft.fromUser}
						placeholder={t('Search_filter_username_placeholder')}
						onChange={updateDraft('fromUser')}
						addon={<Icon name='at' size='x16' />}
					/>
				</Box>
				<Box>
					<Box fontScale='c1' color='hint' mbe={4}>
						{t('Search_filter_date_from')}
					</Box>
					<Box
						is='input'
						type='date'
						value={draft.afterDate}
						onChange={updateDraft('afterDate')}
						width='full'
						height='x40'
						pi={12}
						border='var(--rcx-border-width-default) solid var(--rcx-color-stroke-light)'
						borderRadius={4}
						bg='surface-light'
						color='default'
					/>
				</Box>
				<Box>
					<Box fontScale='c1' color='hint' mbe={4}>
						{t('Search_filter_date_to')}
					</Box>
					<Box
						is='input'
						type='date'
						value={draft.beforeDate}
						onChange={updateDraft('beforeDate')}
						width='full'
						height='x40'
						pi={12}
						border='var(--rcx-border-width-default) solid var(--rcx-color-stroke-light)'
						borderRadius={4}
						bg='surface-light'
						color='default'
					/>
				</Box>
			</Box>
			{roomSuggestions.length > 0 && (
				<Box display='flex' flexWrap='wrap' style={{ gap: 6 }}>
					{roomSuggestions.slice(0, 6).map((room) => (
						<Button key={room._id} small secondary onClick={() => onSelectRoom(room)}>
							{t('Search_in', { room: `#${room.fname || room.name}` })}
						</Button>
					))}
				</Box>
			)}
		</Box>
	);
};

// The page coordinates URL state, feature gates, and four result types; split helpers above keep the render branches localized.
// eslint-disable-next-line complexity
const SearchPage = (): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const queryParam = useSearchParameter('q') ?? '';
	const tabParam = useSearchParameter('tab');
	const ridParam = useSearchParameter('rid') ?? undefined;
	const ridNameParam = useSearchParameter('ridName') ?? undefined;
	const fromUserParam = useSearchParameter('fromUser') ?? undefined;
	const afterDateParam = useSearchParameter('afterDate') ?? undefined;
	const beforeDateParam = useSearchParameter('beforeDate') ?? undefined;
	const activeTab = getValidTab(tabParam);
	const [filterDraft, setFilterDraft] = useState<SearchFilterDraft>({
		rid: ridParam,
		roomName: ridNameParam || '',
		fromUser: fromUserParam || '',
		afterDate: afterDateParam || '',
		beforeDate: beforeDateParam || '',
	});
	const [intelligentCount, setIntelligentCount] = useState(5);

	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const globalMessagesEnabledSetting = useSetting('Search.defaultProvider.GlobalSearchEnabled', false);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule('chat.rocket.rc-ai');
	const unifiedSearch = useEndpoint('GET', '/v1/search.unified');

	const debouncedQueryParam = useDebouncedValue(queryParam.trim(), 300);
	const debouncedRoomFilterText = useDebouncedValue(filterDraft.roomName.trim(), 300);
	const localRoomsQuery = useMemo(() => {
		const filterRegex = new RegExp(escapeRegExp(debouncedRoomFilterText || debouncedQueryParam), 'i');
		return {
			$or: [{ name: filterRegex }, { fname: filterRegex }],
			t: { $ne: 'd' },
		};
	}, [debouncedQueryParam, debouncedRoomFilterText]);
	const localRooms = useUserSubscriptions(localRoomsQuery, roomLookupOptions);
	const debouncedFilters = useDebouncedValue(
		{
			rid: ridParam,
			fromUser: fromUserParam,
			afterDate: afterDateParam,
			beforeDate: beforeDateParam,
		},
		200,
	);

	useEffect(() => {
		setFilterDraft({
			rid: ridParam,
			roomName: ridNameParam || '',
			fromUser: fromUserParam || '',
			afterDate: afterDateParam || '',
			beforeDate: beforeDateParam || '',
		});
		setIntelligentCount(5);
	}, [afterDateParam, beforeDateParam, fromUserParam, queryParam, ridNameParam, ridParam]);

	const result = useQuery({
		queryKey: [
			'search/unified/page',
			debouncedQueryParam,
			hasIntelligentSearchLicense,
			intelligentSearchEnabled,
			intelligentCount,
			debouncedFilters,
		],
		queryFn: () =>
			unifiedSearch({
				query: debouncedQueryParam,
				count: 20,
				intelligentCount,
				includeMessages: true,
				includeIntelligent: Boolean(hasIntelligentSearchLicense && intelligentSearchEnabled),
				...(debouncedFilters.rid && { rid: debouncedFilters.rid }),
				...(debouncedFilters.fromUser && { fromUsername: debouncedFilters.fromUser.replace(/^@/, '') }),
				...(debouncedFilters.afterDate && { startDate: new Date(`${debouncedFilters.afterDate}T00:00:00.000`).toISOString() }),
				...(debouncedFilters.beforeDate && { endDate: new Date(`${debouncedFilters.beforeDate}T23:59:59.999`).toISOString() }),
			}),
		enabled: Boolean(debouncedQueryParam.length),
	});

	const { data } = result;

	const globalMessagesEnabled = data?.meta?.globalMessagesEnabled ?? Boolean(globalMessagesEnabledSetting);
	const hasRoomFilter = Boolean(ridParam);
	const intelligentAvailable = Boolean(hasIntelligentSearchLicense && intelligentSearchEnabled);
	const messagesEnabled = hasRoomFilter || globalMessagesEnabled || intelligentAvailable;
	const roomResults = useMemo(
		() => (hasRoomFilter ? [] : mergeRooms(localRooms.map(mapSubscriptionToSearchRoom), (data?.rooms as SearchRoom[] | undefined) ?? [])),
		[data?.rooms, hasRoomFilter, localRooms],
	);
	const combinedMessages = useMemo(
		() =>
			mergeMessageResults(
				(data?.messages as SearchMessageLike[] | undefined) ?? [],
				(data?.intelligent as SearchMessageLike[] | undefined) ?? [],
				intelligentAvailable,
			),
		[data?.intelligent, data?.messages, intelligentAvailable],
	);

	const counts = useMemo(
		() => ({
			users: hasRoomFilter ? 0 : (data?.users.length ?? 0),
			rooms: roomResults.length,
			messages: combinedMessages.length,
			all: (hasRoomFilter ? 0 : (data?.users.length ?? 0)) + roomResults.length + combinedMessages.length,
		}),
		[combinedMessages.length, data?.users.length, hasRoomFilter, roomResults.length],
	);
	const visibleTabs = useMemo(() => {
		const visible: SearchTab[] = ['all'];
		if (messagesEnabled) {
			visible.push('messages');
		}
		if (!hasRoomFilter) {
			visible.push('users', 'rooms');
		}
		return visible;
	}, [hasRoomFilter, messagesEnabled]);
	const selectedTab = visibleTabs.includes(activeTab) ? activeTab : 'all';

	const handleTabClick = (tab: SearchTab) => (): void => {
		const searchParams = new URLSearchParams();
		if (queryParam.trim()) searchParams.set('q', queryParam.trim());
		if (tab !== 'all') searchParams.set('tab', tab);
		if (ridParam) searchParams.set('rid', ridParam);
		if (ridNameParam) searchParams.set('ridName', ridNameParam);
		if (fromUserParam) searchParams.set('fromUser', fromUserParam);
		if (afterDateParam) searchParams.set('afterDate', afterDateParam);
		if (beforeDateParam) searchParams.set('beforeDate', beforeDateParam);
		router.navigate({ name: 'search', search: Object.fromEntries(searchParams.entries()) });
	};

	const navigateWithFilters = useCallback(
		(nextFilters: SearchFilterDraft) => {
			const searchParams = new URLSearchParams();
			if (queryParam.trim()) searchParams.set('q', queryParam.trim());
			if (selectedTab !== 'all') searchParams.set('tab', selectedTab);
			if (nextFilters.rid) searchParams.set('rid', nextFilters.rid);
			if (nextFilters.rid && nextFilters.roomName) searchParams.set('ridName', nextFilters.roomName);
			if (nextFilters.fromUser.trim()) searchParams.set('fromUser', nextFilters.fromUser.trim().replace(/^@/, ''));
			if (nextFilters.afterDate) searchParams.set('afterDate', nextFilters.afterDate);
			if (nextFilters.beforeDate) searchParams.set('beforeDate', nextFilters.beforeDate);
			router.navigate({ name: 'search', search: Object.fromEntries(searchParams.entries()) });
		},
		[queryParam, router, selectedTab],
	);

	const handleApplyFilters = useCallback(() => {
		const exactRoom = localRooms.find(({ name, fname }) =>
			[name, fname].some((roomName) => roomName?.toLowerCase() === filterDraft.roomName.toLowerCase()),
		);
		navigateWithFilters({
			...filterDraft,
			rid: filterDraft.rid || exactRoom?.rid || exactRoom?._id,
			roomName: filterDraft.rid ? filterDraft.roomName : exactRoom?.fname || exactRoom?.name || '',
		});
	}, [filterDraft, localRooms, navigateWithFilters]);

	const handleClearFilters = useCallback(() => {
		setFilterDraft({ roomName: '', fromUser: '', afterDate: '', beforeDate: '' });
		navigateWithFilters({ roomName: '', fromUser: '', afterDate: '', beforeDate: '' });
	}, [navigateWithFilters]);

	const handleSelectFilterRoom = useCallback((room: SearchRoom) => {
		setFilterDraft((currentDraft) => ({
			...currentDraft,
			rid: room._id,
			roomName: room.fname || room.name,
		}));
	}, []);

	const showSectionHeaders = selectedTab === 'all';
	const showUsers = !hasRoomFilter && (selectedTab === 'all' || selectedTab === 'users');
	const showRooms = !hasRoomFilter && (selectedTab === 'all' || selectedTab === 'rooms');
	const showMessages = selectedTab === 'all' || selectedTab === 'messages';
	const showIntelligentWarning = selectedTab === 'all' || selectedTab === 'messages';
	const hasQuery = Boolean(debouncedQueryParam || ridParam || fromUserParam || afterDateParam || beforeDateParam);
	const hasResults = counts[selectedTab] > 0;

	return (
		<Page background='tint'>
			<PageHeader title={t('Search')} />
			<Tabs>
				{visibleTabs.map((tab) => (
					<TabsItem key={tab} selected={selectedTab === tab} onClick={handleTabClick(tab)}>
						{t(`Search_tab_${tab}`)}
						{hasQuery && (
							<Box is='span' mis={4}>
								{counts[tab]}
							</Box>
						)}
					</TabsItem>
				))}
			</Tabs>
			<PageScrollableContentWithShadow p={24}>
				<Box marginInline='auto' width='full' maxWidth='x800'>
					<SearchFilterPanel
						draft={filterDraft}
						roomSuggestions={roomResults}
						onDraftChange={setFilterDraft}
						onSelectRoom={handleSelectFilterRoom}
						onApply={handleApplyFilters}
						onClear={handleClearFilters}
					/>
					{activeTab === 'messages' && !messagesEnabled && !result.isLoading && data && (
						<Callout type='warning' icon='warning' title={t('Search_messages_disabled_title')} mbe={16}>
							{t('Search_messages_disabled_description')}
						</Callout>
					)}

					{!hasIntelligentSearchLicense && showIntelligentWarning && (
						<Callout type='info' icon='stars' title={t('Intelligent_Search_upsell_title')} mbe={16}>
							<Box display='flex' alignItems='center' justifyContent='space-between'>
								<Box mie={16}>{t('Intelligent_Search_upsell_description')}</Box>
								<Button small onClick={() => router.navigate('/admin/subscription')}>
									{t('View_options')}
								</Button>
							</Box>
						</Callout>
					)}
					{hasIntelligentSearchLicense && !intelligentSearchEnabled && showIntelligentWarning && (
						<Callout type='warning' icon='warning' title={t('Intelligent_Search_disabled_title')} mbe={16}>
							<Box display='flex' alignItems='center' justifyContent='space-between'>
								<Box mie={16}>{t('Intelligent_Search_disabled_description')}</Box>
								<Button small onClick={() => router.navigate('/admin/ai-center/search')}>
									{t('Configure')}
								</Button>
							</Box>
						</Callout>
					)}
					{hasIntelligentSearchLicense &&
						intelligentSearchEnabled &&
						data &&
						!data.meta.intelligentSearchConfigured &&
						showIntelligentWarning && (
							<Callout type='warning' icon='warning' title={t('Intelligent_Search_missing_configuration_title')} mbe={16}>
								<Box display='flex' alignItems='center' justifyContent='space-between'>
									<Box mie={16}>{t('Intelligent_Search_missing_configuration_description')}</Box>
									<Button small onClick={() => router.navigate('/admin/ai-center/search')}>
										{t('Configure')}
									</Button>
								</Box>
							</Callout>
						)}

					{!hasQuery && <EmptySearchState>{t('Search_page_empty_state')}</EmptySearchState>}
					{result.isLoading && <EmptySearchState>{t('Loading')}</EmptySearchState>}
					{hasQuery && !result.isLoading && !hasResults && <EmptySearchState>{t('No_results_found')}</EmptySearchState>}

					{data && !result.isLoading && (
						<>
							{showMessages && (
								<Section title={t('Messages')} count={combinedMessages.length} showHeader={showSectionHeaders}>
									{combinedMessages.map(({ item, isIntelligent }) => (
										<MessageResultItem
											key={`${isIntelligent ? 'intelligent' : 'message'}-${item._id}`}
											item={item}
											href={getMessageHref(item)}
											isIntelligent={isIntelligent}
										/>
									))}
									{intelligentAvailable && data.intelligent.length >= intelligentCount && (
										<Box p={8} borderBlockStart='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'>
											<Button small width='full' onClick={() => setIntelligentCount((currentCount) => currentCount + 10)}>
												{t('Search_load_more_intelligent_results')}
											</Button>
										</Box>
									)}
								</Section>
							)}
							{showUsers && (
								<Section title={t('Users')} count={data.users.length} showHeader={showSectionHeaders}>
									{(data.users as SearchUser[]).map((user) => (
										<SearchResultLink
											key={`user-${user._id}`}
											href={roomCoordinator.getRouteLink('d', { name: user.username }) || undefined}
											icon={<UserAvatar size='x28' username={user.username} etag={user.avatarETag} />}
											title={user.name || user.username}
											subtitle={`@${user.username}`}
											meta={user.status ? <Tag>{user.status}</Tag> : undefined}
										/>
									))}
								</Section>
							)}
							{showRooms && (
								<Section title={t('Rooms')} count={roomResults.length} showHeader={showSectionHeaders}>
									{roomResults.map((room) => (
										<SearchResultLink
											key={`room-${room._id}`}
											href={roomCoordinator.getRouteLink(room.t, { rid: room._id, name: room.name }) || undefined}
											icon={<RoomAvatar size='x28' room={{ ...room, type: room.t }} />}
											title={room.fname || room.name}
											subtitle={room.t === 'd' ? t('Direct_message') : t('Room')}
										/>
									))}
								</Section>
							)}
						</>
					)}
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default SearchPage;
