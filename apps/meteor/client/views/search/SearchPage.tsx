import { AI_LICENSE_MODULE, MAX_SEARCH_ANSWER_MESSAGES } from '@rocket.chat/ai-search';
import { Box, Button, Callout, Skeleton } from '@rocket.chat/fuselage';
import { Page, PageScrollableContentWithShadow, useDocumentTitle, useFeaturePreview, useHasLicenseModule } from '@rocket.chat/ui-client';
import { useSearchParameter, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import SearchAnswerPanel from './SearchAnswerPanel';
import SearchResultsHeader from './SearchResultsHeader';
import SearchSourceResult from './SearchSourceResult';
import { useAISearchAnswer } from './hooks/useAISearchAnswer';
import { useAISearchResults } from './hooks/useAISearchResults';
import AISearchErrorCallout from '../../components/AISearchErrorCallout';
import ResultsLiveRegion from '../../components/ResultsLiveRegion';

const SearchPage = (): ReactElement => {
	const { t } = useTranslation();
	useDocumentTitle(t('Intelligent_Search'));
	const queryParam = useSearchParameter('q') ?? '';
	const aiSearchFeatureEnabled = useFeaturePreview('aiSearch');
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense } = useHasLicenseModule(AI_LICENSE_MODULE);
	const canUseAISearch = Boolean(hasIntelligentSearchLicense && aiSearchFeatureEnabled);
	const {
		query: debouncedQuery,
		filters,
		intelligent,
		meta,
		hasMoreResults,
		loadMore,
		isLoading,
		isPlaceholderData,
		error: searchError,
		refetch: refetchResults,
	} = useAISearchResults(queryParam, canUseAISearch && intelligentSearchEnabled);
	const answerMessages = useMemo(
		() =>
			intelligent.slice(0, MAX_SEARCH_ANSWER_MESSAGES).map((item) => ({
				_id: item.msgId || item._id,
				score: item.score,
			})),
		[intelligent],
	);

	const showUpsell = hasIntelligentSearchLicense === false;
	const showFeatureDisabled = Boolean(hasIntelligentSearchLicense && !aiSearchFeatureEnabled);
	const showSearchDisabled = canUseAISearch && !intelligentSearchEnabled;
	const showNotConfigured = Boolean(canUseAISearch && intelligentSearchEnabled && meta && !meta.intelligentSearchConfigured);
	const showCallouts = showUpsell || showFeatureDisabled || showSearchDisabled || showNotConfigured || !!searchError;

	const canGenerateAnswer = Boolean(meta?.answerGenerationConfigured && !isPlaceholderData && debouncedQuery && intelligent.length > 0);
	const answerResult = useAISearchAnswer(debouncedQuery, answerMessages, canGenerateAnswer);
	const answerEmptyReason = useMemo(() => {
		if (!debouncedQuery) {
			return t('Search_AI_answer_start_from_top_bar');
		}

		if (isLoading) {
			return t('Search_AI_answer_waiting_for_sources');
		}

		if (searchError) {
			return t('Search_AI_answer_sources_error');
		}

		if (!intelligent.length) {
			return t('Search_AI_answer_no_sources');
		}

		if (!meta?.answerGenerationConfigured) {
			return t('Search_AI_answer_disabled');
		}

		return t('Search_AI_answer_ready');
	}, [debouncedQuery, intelligent.length, isLoading, meta?.answerGenerationConfigured, searchError, t]);

	return (
		<Page background='tint'>
			<PageScrollableContentWithShadow padding={24}>
				<Box marginInline='auto' width='full' maxWidth='x800'>
					<SearchResultsHeader query={debouncedQuery} filters={filters} />
					{showCallouts && (
						<Box display='flex' flexDirection='column' gap={16} marginBlockEnd={16}>
							{showUpsell && (
								<Callout type='info' icon='stars' title={t('Intelligent_Search_upsell_title')}>
									{t('Intelligent_Search_upsell_description')}
								</Callout>
							)}
							{showFeatureDisabled && (
								<Callout type='warning' icon='warning' title={t('AI_Search_feature_disabled_title')}>
									{t('AI_Search_feature_disabled_description')}
								</Callout>
							)}
							{showSearchDisabled && (
								<Callout type='warning' icon='warning' title={t('Intelligent_Search_disabled_title')}>
									{t('Intelligent_Search_disabled_description')}
								</Callout>
							)}
							{showNotConfigured && <AISearchErrorCallout role='alert' notConfigured />}
							{searchError && <AISearchErrorCallout role='alert' error={searchError} onRetry={() => void refetchResults()} />}
						</Box>
					)}
					{debouncedQuery && (
						<SearchAnswerPanel
							answer={answerResult.data?.answer}
							provider={answerResult.data?.provider}
							isLoading={answerResult.isFetching}
							error={answerResult.error}
							disabled={!canGenerateAnswer}
							emptyReason={answerEmptyReason}
							onRetry={() => void answerResult.refetch()}
						/>
					)}
					<ResultsLiveRegion shouldAnnounce={false} itemCount={intelligent.length} isLoading={isLoading} />
					{isLoading && (
						<Box aria-busy={isLoading} display='flex' flexDirection='column' justifyContent='center'>
							<Skeleton width='100%' />
							<Skeleton width='100%' />
							<Skeleton width='100%' />
						</Box>
					)}
					{debouncedQuery && !isLoading && !searchError && intelligent.length === 0 && (
						<Box display='flex' justifyContent='center' color='hint' padding={24}>
							{t('No_results_found')}
						</Box>
					)}
					<Box role='list' aria-label={t('Sources')}>
						{intelligent.map((item) => (
							<SearchSourceResult key={item._id} item={item} />
						))}
					</Box>
					{hasMoreResults && (
						<Box marginBlockStart={20}>
							<Button onClick={loadMore}>{t('Show_more_messages')}</Button>
						</Box>
					)}
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default SearchPage;
