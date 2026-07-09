import { AI_LICENSE_MODULE, buildRoomSearchQuery, parseSearchFilterText } from '@rocket.chat/ai-search';
import { Box, Button, Callout, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { Page, PageHeader, PageScrollableContentWithShadow, useFeaturePreview } from '@rocket.chat/ui-client';
import { useEndpoint, useSearchParameter, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SearchAnswerPanel from './SearchAnswerPanel';
import { SearchSourceResult } from './SearchSourceResult';
import type { IntelligentResult } from './types';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

const roomLookupOptions = { sort: { lm: -1, name: 1 }, limit: 20 } as const;
const emptyRoomLookupQuery = { _id: '__ai_search_no_room_filter__' };

// Number of results revealed per page, and the upper bound on the source set the AI answer is
// generated from. Both are tied to the same constant so that paginating ("Show more") only appends
// results and never changes the answer source set — preventing a redundant answer regeneration.
const INTELLIGENT_PAGE_SIZE = 8;

const SearchPage = (): ReactElement => {
	const { t } = useTranslation();
	const queryParam = useSearchParameter('q') ?? '';
	const [intelligentCount, setIntelligentCount] = useState(INTELLIGENT_PAGE_SIZE);
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
		setIntelligentCount(INTELLIGENT_PAGE_SIZE);
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
	// Only the first page of results feeds the AI answer. Revealing more results via "Show more"
	// appends to the list without changing this slice, so the answer is not regenerated on paginate.
	const answerMessages = useMemo(
		() =>
			intelligent.slice(0, INTELLIGENT_PAGE_SIZE).map((item) => ({
				_id: item._id,
				score: item.score,
			})),
		[intelligent],
	);
	const answerKey = useMemo(
		() =>
			JSON.stringify({
				query: debouncedQuery,
				messages: answerMessages,
			}),
		[answerMessages, debouncedQuery],
	);
	const answerAbortRef = useRef<AbortController | undefined>(undefined);
	const abortPendingAnswer = useCallback((): void => answerAbortRef.current?.abort(), []);
	const answerMutation = useMutation({
		mutationFn: () => {
			abortPendingAnswer();
			const controller = new AbortController();
			answerAbortRef.current = controller;
			return generateAnswer({ query: debouncedQuery, messages: answerMessages }, { signal: controller.signal });
		},
	});
	const { data: answerData, error: answerError, isPending: answerPending, mutate: mutateAnswer, reset: resetAnswer } = answerMutation;

	// When the query or source set changes, drop the previous answer and abort any in-flight LLM
	// request so a stale (and costly) generation cannot resolve into the new context.
	useEffect(() => {
		resetAnswer();
		return abortPendingAnswer;
	}, [answerKey, resetAnswer, abortPendingAnswer]);

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
					<Box display='flex' flexDirection='column' mbe={16} gap={8}>
						{debouncedQuery ? (
							<Box display='flex' alignItems='center' fontScale='h4' gap={8} minWidth={0}>
								<Icon name='magnifier' size='x18' />
								<Box display='flex' alignItems='baseline' gap={8} minWidth={0}>
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
						<Box display='flex' alignItems='center' color='hint' fontScale='p2' gap={8}>
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
						<SearchAnswerPanel
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
							<Button small onClick={() => setIntelligentCount((current) => current + INTELLIGENT_PAGE_SIZE)}>
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
					<Box>
						{intelligent.map((item) => (
							<SearchSourceResult key={item._id} item={item} />
						))}
					</Box>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default SearchPage;
