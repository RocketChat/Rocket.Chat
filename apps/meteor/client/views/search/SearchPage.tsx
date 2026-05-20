/* eslint-disable react/no-multi-comp */
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Box, Button, Callout, Icon, SearchInput, Tabs, TabsItem, Tag } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar, UserAvatar } from '@rocket.chat/ui-avatar';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useEndpoint, useRouter, useSearchParameter, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ChangeEvent, FormEvent, ReactElement, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type SearchTab = 'all' | 'messages' | 'users' | 'rooms' | 'intelligent';

type SearchUser = Pick<Required<IUser>, 'name' | 'status' | '_id' | 'username'> & Partial<Pick<IUser, 'statusText' | 'avatarETag'>>;

type SearchRoom = Pick<Required<IRoom>, 't' | 'name' | '_id'> & Partial<Pick<IRoom, 'fname'>>;

type SearchMessageLike = {
	_id: string;
	rid?: string;
	msg?: string;
	msgId?: string;
	text?: string;
	score?: number;
	room?: Pick<IRoom, '_id' | 't' | 'name' | 'fname'>;
};

const tabs: SearchTab[] = ['all', 'messages', 'users', 'rooms', 'intelligent'];

const getValidTab = (tab?: string | null): SearchTab => (tabs.includes(tab as SearchTab) ? (tab as SearchTab) : 'all');

const getMessageText = (item: SearchMessageLike): string => {
	if ('text' in item) {
		return item.text || '';
	}

	return item.msg || '';
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

	if (!href) {
		return undefined;
	}

	return `${href}?msg=${encodeURIComponent(getMessageId(item))}`;
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

const EmptySearchState = ({ children }: { children: ReactNode }): ReactElement => (
	<Box display='flex' justifyContent='center' color='hint' fontScale='p2' p={24}>
		{children}
	</Box>
);

const Section = ({ title, count, children }: { title: string; count: number; children: ReactNode }): ReactElement | null => {
	if (count === 0) {
		return null;
	}

	return (
		<Box mbe={24}>
			<Box display='flex' alignItems='center' mbe={8}>
				<Box is='h2' fontScale='h4' mie={8}>
					{title}
				</Box>
				<Tag>{count}</Tag>
			</Box>
			<Box border='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)' borderRadius={4} overflow='hidden'>
				{children}
			</Box>
		</Box>
	);
};

const SearchPage = (): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const queryParam = useSearchParameter('q') ?? '';
	const tabParam = useSearchParameter('tab');
	const activeTab = getValidTab(tabParam);
	const [query, setQuery] = useState(queryParam);
	const debouncedQuery = useDebouncedValue(query.trim(), 300);

	const globalSearchEnabled = useSetting('Search.defaultProvider.GlobalSearchEnabled', false);
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule('chat.rocket.rc-ai');
	const unifiedSearch = useEndpoint('GET', '/v1/search.unified');

	useEffect(() => {
		setQuery(queryParam);
	}, [queryParam]);

	const result = useQuery({
		queryKey: ['search/unified/page', debouncedQuery, hasIntelligentSearchLicense, globalSearchEnabled, intelligentSearchEnabled],
		queryFn: () =>
			unifiedSearch({
				query: debouncedQuery,
				count: 20,
				includeMessages: Boolean(globalSearchEnabled),
				includeIntelligent: Boolean(hasIntelligentSearchLicense && intelligentSearchEnabled),
			}),
		enabled: debouncedQuery.length > 0,
	});

	const { data } = result;
	const counts = useMemo(
		() => ({
			users: data?.users.length ?? 0,
			rooms: data?.rooms.length ?? 0,
			messages: data?.messages.length ?? 0,
			intelligent: data?.intelligent.length ?? 0,
			all: (data?.users.length ?? 0) + (data?.rooms.length ?? 0) + (data?.messages.length ?? 0) + (data?.intelligent.length ?? 0),
		}),
		[data],
	);

	const navigateSearch = (nextQuery: string, nextTab = activeTab): void => {
		const searchParams = new URLSearchParams();
		if (nextQuery.trim()) {
			searchParams.set('q', nextQuery.trim());
		}
		if (nextTab !== 'all') {
			searchParams.set('tab', nextTab);
		}
		router.navigate({
			name: 'search',
			search: Object.fromEntries(searchParams.entries()),
		});
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
		setQuery(event.currentTarget.value);
	};

	const handleSubmit = (event: FormEvent): void => {
		event.preventDefault();
		navigateSearch(query);
	};

	const handleTabClick = (tab: SearchTab) => (): void => {
		navigateSearch(query, tab);
	};

	const showUsers = activeTab === 'all' || activeTab === 'users';
	const showRooms = activeTab === 'all' || activeTab === 'rooms';
	const showMessages = activeTab === 'all' || activeTab === 'messages';
	const showIntelligent = activeTab === 'all' || activeTab === 'intelligent';
	const hasQuery = Boolean(debouncedQuery);
	const hasResults = counts[activeTab] > 0;

	return (
		<Page background='tint'>
			<PageHeader title={t('Search')} />
			<Box is='form' onSubmit={handleSubmit} pi={24} pbe={16}>
				<SearchInput
					value={query}
					placeholder={t('Search_users_rooms_messages')}
					onChange={handleChange}
					addon={<Icon name='magnifier' size='x20' />}
				/>
			</Box>
			<Tabs>
				{tabs.map((tab) => (
					<TabsItem key={tab} selected={activeTab === tab} onClick={handleTabClick(tab)}>
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
					{!globalSearchEnabled && showMessages && (
						<Callout type='warning' icon='warning' title={t('Search_messages_disabled_title')} mbe={16}>
							{t('Search_messages_disabled_description')}
						</Callout>
					)}
					{!hasIntelligentSearchLicense && showIntelligent && (
						<Callout type='info' icon='stars' title={t('Intelligent_Search_upsell_title')} mbe={16}>
							<Box display='flex' alignItems='center' justifyContent='space-between'>
								<Box mie={16}>{t('Intelligent_Search_upsell_description')}</Box>
								<Button small onClick={() => router.navigate('/admin/subscription')}>
									{t('View_options')}
								</Button>
							</Box>
						</Callout>
					)}
					{hasIntelligentSearchLicense && !intelligentSearchEnabled && showIntelligent && (
						<Callout type='warning' icon='warning' title={t('Intelligent_Search_disabled_title')} mbe={16}>
							<Box display='flex' alignItems='center' justifyContent='space-between'>
								<Box mie={16}>{t('Intelligent_Search_disabled_description')}</Box>
								<Button small onClick={() => router.navigate('/admin/ai-center/search')}>
									{t('Configure')}
								</Button>
							</Box>
						</Callout>
					)}
					{hasIntelligentSearchLicense && intelligentSearchEnabled && data && !data.meta.intelligentSearchConfigured && showIntelligent && (
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
							{showIntelligent && (
								<Section title={t('Intelligent_Search')} count={data.intelligent.length}>
									{data.intelligent.map((item) => (
										<SearchResultLink
											key={`intelligent-${item._id}`}
											href={getMessageHref(item)}
											icon={<Icon name='stars' size='x20' />}
											title={getMessageText(item)}
											subtitle={item.room?.fname || item.room?.name || t('Intelligent_Search_Result')}
											meta={typeof item.score === 'number' ? <Tag>{Math.round(item.score * 100)}%</Tag> : undefined}
										/>
									))}
								</Section>
							)}
							{showMessages && (
								<Section title={t('Messages')} count={data.messages.length}>
									{data.messages.map((item) => (
										<SearchResultLink
											key={`message-${item._id}`}
											href={getMessageHref(item)}
											icon={<Icon name='post' size='x20' />}
											title={getMessageText(item)}
											subtitle={item.room?.fname || item.room?.name || item.u?.username}
										/>
									))}
								</Section>
							)}
							{showUsers && (
								<Section title={t('Users')} count={data.users.length}>
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
								<Section title={t('Rooms')} count={data.rooms.length}>
									{(data.rooms as SearchRoom[]).map((room) => (
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
