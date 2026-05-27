/* eslint-disable react/no-multi-comp */
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Box, Button, Callout, Icon, Skeleton, Tag } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useEndpoint, useSearchParameter, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../components/MarkdownText';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { buildRoomSearchQuery, parseSearchFilterText } from '../../navbar/NavBarSearch/hooks/useSearchItems';

type IntelligentResult = {
	_id: string;
	rid?: string;
	msgId?: string;
	text: string;
	score?: number;
	ts?: Date | string;
	u?: Pick<IUser, 'username' | 'name'>;
	room?: Pick<IRoom, '_id' | 't' | 'name' | 'fname'>;
};

const roomLookupOptions = { sort: { lm: -1, name: 1 }, limit: 20 } as const;

const formatMessageTime = (ts: Date | string | undefined): string => {
	if (!ts) return '';
	const date = new Date(ts);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getMessageHref = (item: IntelligentResult): string | undefined => {
	const { room } = item;
	const href = roomCoordinator.getRouteLink(room?.t || 'c', {
		rid: room?._id || item.rid,
		name: room?.name,
	});
	if (!href) return undefined;
	return `${href}?msg=${encodeURIComponent(item.msgId || item._id)}`;
};

const SourceResult = ({ item, index }: { item: IntelligentResult; index: number }): ReactElement => {
	const { t } = useTranslation();
	const roomLabel = item.room?.fname || item.room?.name;
	const href = getMessageHref(item);

	return (
		<Box
			is={href ? 'a' : 'div'}
			href={href}
			display='flex'
			flexDirection='column'
			p={16}
			mbe={8}
			border='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'
			borderRadius={4}
			bg='surface-light'
			color='default'
			style={{ textDecoration: 'none', gap: 8 }}
		>
			<Box display='flex' alignItems='center' color='hint' fontScale='c1' style={{ gap: 8 }}>
				<Tag>{index + 1}</Tag>
				{roomLabel && (
					<Box display='flex' alignItems='center' style={{ gap: 4 }}>
						<Icon name='hash' size='x12' />
						{roomLabel}
					</Box>
				)}
				{item.u?.username && <Box>@{item.u.username}</Box>}
				{item.ts && <Box>{formatMessageTime(item.ts)}</Box>}
			</Box>
			<Box fontScale='p2' style={{ lineHeight: 1.45, wordBreak: 'break-word' }}>
				{item.text || t('Intelligent_Search_Result')}
			</Box>
		</Box>
	);
};

const AnswerPanel = ({
	answer,
	provider,
	isLoading,
	error,
	disabled,
	emptyReason,
	onGenerate,
}: {
	answer?: string;
	provider?: { name: string; model: string };
	isLoading: boolean;
	error?: unknown;
	disabled: boolean;
	emptyReason: string;
	onGenerate: () => void;
}): ReactElement => {
	const { t } = useTranslation();
	const answerContent = (): ReactElement => {
		if (isLoading) {
			return (
				<Box display='flex' flexDirection='column' style={{ gap: 12 }} aria-busy='true' aria-label={t('Loading')}>
					<Skeleton width='60%' />
					<Skeleton width='100%' />
					<Skeleton width='95%' />
					<Skeleton width='88%' />
					<Skeleton width='72%' />
				</Box>
			);
		}

		if (answer) {
			return <MarkdownText content={answer} parseEmoji fontScale='p2' style={{ lineHeight: 1.55 }} />;
		}

		return (
			<Box color='hint' fontScale='p2'>
				{disabled ? emptyReason : t('Search_AI_answer_ready')}
			</Box>
		);
	};

	return (
		<Box
			display='flex'
			flexDirection='column'
			mbe={24}
			border='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'
			borderRadius={4}
			bg='surface-light'
		>
			<Box
				display='flex'
				alignItems='center'
				justifyContent='space-between'
				p={16}
				borderBlockEnd='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'
			>
				<Box display='flex' alignItems='center' fontScale='h4' style={{ gap: 8 }}>
					<Icon name='stars' size='x18' />
					{t('Search_AI_answer')}
				</Box>
				<Button small disabled={disabled || isLoading} onClick={onGenerate}>
					{isLoading ? t('Loading') : t(answer ? 'Regenerate' : 'Generate')}
				</Button>
			</Box>
			<Box p={16}>
				{provider && (
					<Box color='hint' fontScale='c1' mbe={8}>
						{t('Search_AI_answer_provider', { provider: provider.name, model: provider.model })}
					</Box>
				)}
				{Boolean(error) && (
					<Box color='danger' fontScale='p2'>
						{t('Search_AI_answer_error')}
					</Box>
				)}
				{answerContent()}
			</Box>
		</Box>
	);
};

const SearchPage = (): ReactElement => {
	const { t } = useTranslation();
	const queryParam = useSearchParameter('q') ?? '';
	const [intelligentCount, setIntelligentCount] = useState(8);
	const parsedSearch = useMemo(() => parseSearchFilterText(queryParam), [queryParam]);
	const roomLookupQuery = useMemo(() => buildRoomSearchQuery(parsedSearch.filters.roomName || '', '#'), [parsedSearch.filters.roomName]);
	const roomFilterRooms = useUserSubscriptions(roomLookupQuery, roomLookupOptions);
	const selectedRoom = useMemo(() => {
		if (!parsedSearch.filters.roomName) {
			return undefined;
		}

		return roomFilterRooms.find(({ name, fname }) => [name, fname].filter(Boolean).includes(parsedSearch.filters.roomName));
	}, [parsedSearch.filters.roomName, roomFilterRooms]);
	const resolvedFilters = useMemo(
		() => ({
			...parsedSearch.filters,
			...(selectedRoom && { rid: selectedRoom.rid || selectedRoom._id }),
		}),
		[parsedSearch.filters, selectedRoom],
	);
	const debouncedQuery = useDebouncedValue(parsedSearch.searchText.trim(), 300);
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule('chat.rocket.rc-ai');
	const unifiedSearch = useEndpoint('GET', '/v1/search.unified');
	const generateAnswer = useEndpoint('POST', '/v1/search.answer');

	useEffect(() => {
		setIntelligentCount(8);
	}, [queryParam]);

	const result = useQuery({
		queryKey: [
			'search/intelligent/page',
			debouncedQuery,
			resolvedFilters,
			hasIntelligentSearchLicense,
			intelligentSearchEnabled,
			intelligentCount,
		],
		queryFn: () =>
			unifiedSearch({
				query: debouncedQuery,
				count: 0,
				includeSpotlight: false,
				intelligentCount,
				includeMessages: false,
				includeIntelligent: Boolean(hasIntelligentSearchLicense && intelligentSearchEnabled),
				rid: resolvedFilters.rid,
				fromUsername: resolvedFilters.fromUsername,
				startDate: resolvedFilters.startDate,
				endDate: resolvedFilters.endDate,
			}),
		enabled: Boolean(debouncedQuery),
	});

	const intelligent = useMemo(() => (result.data?.intelligent as IntelligentResult[] | undefined) ?? [], [result.data?.intelligent]);
	const answerMutation = useMutation({
		mutationFn: () =>
			generateAnswer({
				query: debouncedQuery,
				messages: intelligent.slice(0, 12).map((item) => ({
					_id: item._id,
					text: item.text,
					username: item.u?.username,
					roomName: item.room?.fname || item.room?.name,
					ts: item.ts ? new Date(item.ts).toISOString() : undefined,
					score: item.score,
				})),
			}),
	});

	useEffect(() => {
		answerMutation.reset();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedQuery, intelligentCount]);

	const canGenerateAnswer = Boolean(result.data?.meta.answerGenerationConfigured && debouncedQuery && intelligent.length > 0);
	const answerEmptyReason = useMemo(() => {
		if (!debouncedQuery) {
			return t('Search_AI_answer_start_from_top_bar');
		}

		if (result.isLoading) {
			return t('Search_AI_answer_waiting_for_sources');
		}

		if (!intelligent.length) {
			return t('Search_AI_answer_no_sources');
		}

		if (!result.data?.meta.answerGenerationConfigured) {
			return t('Search_AI_answer_disabled');
		}

		return t('Search_AI_answer_ready');
	}, [debouncedQuery, intelligent.length, result.data?.meta.answerGenerationConfigured, result.isLoading, t]);

	useEffect(() => {
		if (!canGenerateAnswer || answerMutation.isPending || answerMutation.data || answerMutation.error) {
			return;
		}

		answerMutation.mutate();
	}, [answerMutation, canGenerateAnswer]);

	return (
		<Page background='tint'>
			<PageHeader title={t('Intelligent_Search')} />
			<PageScrollableContentWithShadow p={24}>
				<Box marginInline='auto' width='full' maxWidth='x800'>
					<Box display='flex' flexDirection='column' mbe={16} style={{ gap: 8 }}>
						{debouncedQuery ? (
							<Box display='flex' alignItems='center' fontScale='h4' style={{ gap: 8, minWidth: 0 }}>
								<Icon name='magnifier' size='x18' />
								<Box display='flex' alignItems='baseline' style={{ gap: 8, minWidth: 0 }}>
									<Box flexShrink={0}>{t('Results')}</Box>
									<Box color='hint' withTruncatedText>
										{debouncedQuery}
									</Box>
								</Box>
							</Box>
						) : (
							<Box color='hint' fontScale='p2'>
								{t('Intelligent_Search_page_empty_state')}
							</Box>
						)}
						<Box display='flex' alignItems='center' color='hint' fontScale='p2' style={{ gap: 8 }}>
							<Icon name='stars' size='x14' />
							{t('Intelligent_Search_scope_all_rooms')}
						</Box>
					</Box>
					{!hasIntelligentSearchLicense && (
						<Callout type='info' icon='stars' title={t('Intelligent_Search_upsell_title')} mbe={16}>
							{t('Intelligent_Search_upsell_description')}
						</Callout>
					)}
					{hasIntelligentSearchLicense && !intelligentSearchEnabled && (
						<Callout type='warning' icon='warning' title={t('Intelligent_Search_disabled_title')} mbe={16}>
							{t('Intelligent_Search_disabled_description')}
						</Callout>
					)}
					{hasIntelligentSearchLicense && intelligentSearchEnabled && result.data && !result.data.meta.intelligentSearchConfigured && (
						<Callout type='warning' icon='warning' title={t('Intelligent_Search_missing_configuration_title')} mbe={16}>
							{t('Intelligent_Search_missing_configuration_description')}
						</Callout>
					)}
					{debouncedQuery && (
						<AnswerPanel
							answer={answerMutation.data?.answer}
							provider={answerMutation.data?.provider}
							isLoading={answerMutation.isPending}
							error={answerMutation.error}
							disabled={!canGenerateAnswer}
							emptyReason={answerEmptyReason}
							onGenerate={() => answerMutation.mutate()}
						/>
					)}
					<Box display='flex' alignItems='center' justifyContent='space-between' mbe={12}>
						<Box is='h2' fontScale='h4'>
							{t('Sources')} · {intelligent.length} {t('Messages')}
						</Box>
						{intelligent.length >= intelligentCount && (
							<Button small onClick={() => setIntelligentCount((current) => current + 8)}>
								{t('Show_more')}
							</Button>
						)}
					</Box>
					{!debouncedQuery && (
						<Box display='flex' justifyContent='center' color='hint' p={24}>
							{t('Intelligent_Search_start_from_top_bar')}
						</Box>
					)}
					{result.isLoading && (
						<Box display='flex' justifyContent='center' color='hint' p={24}>
							{t('Loading')}
						</Box>
					)}
					{debouncedQuery && !result.isLoading && intelligent.length === 0 && (
						<Box display='flex' justifyContent='center' color='hint' p={24}>
							{t('No_results_found')}
						</Box>
					)}
					{intelligent.map((item, index) => (
						<SourceResult key={item._id} item={item} index={index} />
					))}
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default SearchPage;
