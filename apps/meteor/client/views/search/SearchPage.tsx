import { AI_LICENSE_MODULE, MAX_SEARCH_ANSWER_MESSAGES, parseSearchFilterText } from '@rocket.chat/ai-search';
import { Box, Button, Callout, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { Page, PageHeader, PageScrollableContentWithShadow, useFeaturePreview } from '@rocket.chat/ui-client';
import { useEndpoint, useSearchParameter, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SearchAnswerPanel from './SearchAnswerPanel';
import { SearchSourceResult } from './SearchSourceResult';
import type { IntelligentResult } from './types';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

const INTELLIGENT_PAGE_SIZE = 8;

const SearchPage = (): ReactElement => {
	const { t } = useTranslation();
	const queryParam = useSearchParameter('q') ?? '';
	const [intelligentCount, setIntelligentCount] = useState(INTELLIGENT_PAGE_SIZE);
	const parsedSearch = useMemo(() => parseSearchFilterText(queryParam), [queryParam]);
	const { filters } = parsedSearch;
	const debouncedQuery = useDebouncedValue(parsedSearch.searchText.trim(), 300);
	const aiSearchFeatureEnabled = useFeaturePreview('aiSearch');
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense } = useHasLicenseModule(AI_LICENSE_MODULE);
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
			filters,
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
				roomNames: filters.roomNames.join(','),
				fromUsernames: filters.fromUsernames.join(','),
				startDate: filters.startDate,
				endDate: filters.endDate,
			}),
		enabled: Boolean(debouncedQuery && canUseAISearch && intelligentSearchEnabled),
		// keeps the revealed results visible while the next page loads
		placeholderData: (previousData) => previousData,
	});

	const intelligent = useMemo(() => (result.data?.intelligent as IntelligentResult[] | undefined) ?? [], [result.data?.intelligent]);
	// the answer regenerates from every revealed result, capped by the search.answer schema limit
	const answerMessages = useMemo(
		() =>
			intelligent.slice(0, MAX_SEARCH_ANSWER_MESSAGES).map((item) => ({
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

	useEffect(() => {
		resetAnswer();
		return abortPendingAnswer;
	}, [answerKey, resetAnswer, abortPendingAnswer]);

	// placeholder data belongs to the previous query key — never generate an answer from it
	const canGenerateAnswer = Boolean(
		result.data?.meta.answerGenerationConfigured && !result.isPlaceholderData && debouncedQuery && intelligent.length > 0,
	);
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
					{hasIntelligentSearchLicense === false && (
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
					<Box role='list'>
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
