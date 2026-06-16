/* eslint-disable react/no-multi-comp */
import { AI_LICENSE_MODULE, buildRoomSearchQuery, MAX_SOURCE_MESSAGE_LENGTH, parseSearchFilterText } from '@rocket.chat/ai-search';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Box, Button, Callout, Icon, Skeleton, Tag } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { Page, PageHeader, PageScrollableContentWithShadow, useFeaturePreview } from '@rocket.chat/ui-client';
import { useEndpoint, useSearchParameter, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../components/MarkdownText';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type IntelligentResult = {
	_id: string;
	rid?: string;
	msgId?: string;
	text: string;
	score?: number;
	ts?: string;
	u?: Pick<IUser, 'username' | 'name'>;
	room?: Pick<IRoom, '_id' | 't' | 'name' | 'fname'>;
};

const roomLookupOptions = { sort: { lm: -1, name: 1 }, limit: 20 } as const;
const emptyRoomLookupQuery = { _id: '__ai_search_no_room_filter__' };

const formatMessageTime = (ts: Date | string | undefined): string => {
	if (!ts) return '';
	const date = new Date(ts);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getMessageHref = (item: IntelligentResult): string | undefined => {
	const { room } = item;
	if (!room) {
		return undefined;
	}

	const href = roomCoordinator.getRouteLink(room.t, {
		rid: room._id || item.rid,
		name: room.name,
	});
	if (!href) return undefined;
	return `${href}?msg=${encodeURIComponent(item.msgId || item._id)}`;
};

const trimSourceMessage = (text: string): string =>
	text.length > MAX_SOURCE_MESSAGE_LENGTH ? `${text.slice(0, MAX_SOURCE_MESSAGE_LENGTH).trimEnd()}...` : text;

export const SourceResult = ({ item }: { item: IntelligentResult }): ReactElement => {
	const { t } = useTranslation();
	const roomLabel = item.room?.fname || item.room?.name;
	const href = getMessageHref(item);
	const username = item.u?.username || item.u?.name || t('Unknown_User');
	const displayName = item.u?.name || username;
	const relevanceScore = typeof item.score === 'number' ? Math.max(0, Math.min(100, Math.round(item.score * 100))) : undefined;

	return (
		<Box
			is={href ? 'a' : 'div'}
			href={href}
			color='default'
			display='flex'
			alignItems='flex-start'
			role='listitem'
			pi={12}
			pbs={10}
			pb={10}
			mbe={8}
			border='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'
			borderRadius={4}
			bg='surface-light'
			style={{ gap: 10, textDecoration: 'none' }}
		>
			<Box flexShrink={0} mbs={2}>
				<MessageAvatar username={username} size='x28' />
			</Box>
			<Box display='flex' flexDirection='column' flexGrow={1} style={{ minWidth: 0, gap: 4 }}>
				<Box display='flex' alignItems='center' style={{ gap: 8, minWidth: 0 }}>
					<Box display='flex' alignItems='baseline' flexWrap='wrap' flexGrow={1} style={{ gap: 6, minWidth: 0 }}>
						<Box is='span' fontScale='p2b' withTruncatedText>
							{displayName}
						</Box>
						{item.u?.username && (
							<Box is='span' color='hint' fontScale='p2' withTruncatedText>
								@{item.u.username}
							</Box>
						)}
						{roomLabel && (
							<Tag>
								<Box display='flex' alignItems='center' style={{ gap: 4 }}>
									<Icon name='hash' size='x12' />
									{roomLabel}
								</Box>
							</Tag>
						)}
						{item.ts && (
							<Box is='span' color='hint' fontScale='p2' flexShrink={0}>
								{formatMessageTime(item.ts)}
							</Box>
						)}
					</Box>
					{typeof relevanceScore === 'number' && (
						<Tag title={`${relevanceScore}%`} style={{ flexShrink: 0 }}>
							{relevanceScore}%
						</Tag>
					)}
				</Box>
				<MarkdownText
					content={trimSourceMessage(item.text || t('Intelligent_Search_Result'))}
					variant='inline'
					parseEmoji
					fontScale='p2'
					style={{ lineHeight: 1.35, wordBreak: 'break-word' }}
				/>
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
	const roomLookupText = parsedSearch.filters.roomNames[parsedSearch.filters.roomNames.length - 1] || '';
	const roomLookupQuery = useMemo(
		() => (roomLookupText ? buildRoomSearchQuery(roomLookupText, '#') : emptyRoomLookupQuery),
		[roomLookupText],
	);
	const roomFilterRooms = useUserSubscriptions(roomLookupQuery, roomLookupOptions);
	const selectedRooms = useMemo(() => {
		if (!parsedSearch.filters.roomNames.length) {
			return [];
		}

		return parsedSearch.filters.roomNames
			.map((roomName) => roomFilterRooms.find(({ name, fname }) => [name, fname].filter(Boolean).includes(roomName)))
			.filter(Boolean) as Array<(typeof roomFilterRooms)[number]>;
	}, [parsedSearch.filters.roomNames, roomFilterRooms]);
	const resolvedFilters = useMemo(
		() => ({
			...parsedSearch.filters,
			rids: selectedRooms.map((room) => room.rid || room._id),
			...(selectedRooms[0] && { rid: selectedRooms[0].rid || selectedRooms[0]._id }),
			...(parsedSearch.filters.fromUsernames[0] && { fromUsername: parsedSearch.filters.fromUsernames[0] }),
		}),
		[parsedSearch.filters, selectedRooms],
	);
	const debouncedQuery = useDebouncedValue(parsedSearch.searchText.trim(), 300);
	const aiSearchFeatureEnabled = useFeaturePreview('aiSearch');
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule(AI_LICENSE_MODULE);
	const canUseAISearch = Boolean(hasIntelligentSearchLicense && aiSearchFeatureEnabled);
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
			aiSearchFeatureEnabled,
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
				includeIntelligent: Boolean(canUseAISearch && intelligentSearchEnabled),
				rid: resolvedFilters.rid,
				rids: resolvedFilters.rids.join(','),
				roomNames: resolvedFilters.roomNames.join(','),
				fromUsername: resolvedFilters.fromUsername,
				fromUsernames: resolvedFilters.fromUsernames.join(','),
				startDate: resolvedFilters.startDate,
				endDate: resolvedFilters.endDate,
			}),
		enabled: Boolean(debouncedQuery && canUseAISearch && intelligentSearchEnabled),
	});

	const intelligent = useMemo(() => (result.data?.intelligent as IntelligentResult[] | undefined) ?? [], [result.data?.intelligent]);
	const answerMessages = useMemo(
		() =>
			intelligent.slice(0, 12).map((item) => ({
				_id: item._id,
				text: item.text,
				username: item.u?.username,
				roomName: item.room?.fname || item.room?.name,
				ts: item.ts ? new Date(item.ts).toISOString() : undefined,
				score: item.score,
			})),
		[intelligent],
	);
	const answerKey = useMemo(
		() =>
			JSON.stringify({
				query: debouncedQuery,
				messages: answerMessages.map(({ _id, text, username, roomName, ts, score }) => ({ _id, text, username, roomName, ts, score })),
			}),
		[answerMessages, debouncedQuery],
	);
	const answerMutation = useMutation({
		mutationFn: () =>
			generateAnswer({
				query: debouncedQuery,
				messages: answerMessages,
			}),
	});
	const { data: answerData, error: answerError, isPending: answerPending, mutate: mutateAnswer, reset: resetAnswer } = answerMutation;

	useEffect(() => {
		resetAnswer();
	}, [answerKey, resetAnswer]);

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
		if (!canGenerateAnswer || answerPending || answerData || answerError) {
			return;
		}

		mutateAnswer();
	}, [answerData, answerError, answerPending, canGenerateAnswer, mutateAnswer]);

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
					{hasIntelligentSearchLicense && !aiSearchFeatureEnabled && (
						<Callout type='warning' icon='warning' title={t('AI_Search_feature_disabled_title')} mbe={16}>
							{t('AI_Search_feature_disabled_description')}
						</Callout>
					)}
					{canUseAISearch && !intelligentSearchEnabled && (
						<Callout type='warning' icon='warning' title={t('Intelligent_Search_disabled_title')} mbe={16}>
							{t('Intelligent_Search_disabled_description')}
						</Callout>
					)}
					{canUseAISearch && intelligentSearchEnabled && result.data && !result.data.meta.intelligentSearchConfigured && (
						<Callout type='warning' icon='warning' title={t('Intelligent_Search_missing_configuration_title')} mbe={16}>
							{t('Intelligent_Search_missing_configuration_description')}
						</Callout>
					)}
					{debouncedQuery && (
						<AnswerPanel
							answer={answerData?.answer}
							provider={answerData?.provider}
							isLoading={answerPending}
							error={answerError}
							disabled={!canGenerateAnswer}
							emptyReason={answerEmptyReason}
							onGenerate={() => mutateAnswer()}
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
					{intelligent.map((item) => (
						<SourceResult key={item._id} item={item} />
					))}
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default SearchPage;
