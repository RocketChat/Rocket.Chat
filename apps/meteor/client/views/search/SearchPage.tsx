import { AI_LICENSE_MODULE, MAX_SEARCH_ANSWER_MESSAGES } from '@rocket.chat/ai-search';
import { Box, Button, Callout } from '@rocket.chat/fuselage';
import { Page, PageScrollableContentWithShadow, useFeaturePreview } from '@rocket.chat/ui-client';
import { useSearchParameter, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import SearchAnswerPanel from './SearchAnswerPanel';
import SearchResultsHeader from './SearchResultsHeader';
import SearchSourceResult from './SearchSourceResult';
import { useAISearchAnswer } from './hooks/useAISearchAnswer';
import { useAISearchResults } from './hooks/useAISearchResults';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

const SearchPage = (): ReactElement => {
	const { t } = useTranslation();
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
	} = useAISearchResults(queryParam, canUseAISearch && intelligentSearchEnabled);
	const answerMessages = useMemo(
		() =>
			intelligent.slice(0, MAX_SEARCH_ANSWER_MESSAGES).map((item) => ({
				_id: item.msgId || item._id,
				score: item.score,
			})),
		[intelligent],
	);

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
					{hasIntelligentSearchLicense === false && (
						<Callout type='info' icon='stars' title={t('Intelligent_Search_upsell_title')} marginBlockEnd={16}>
							{t('Intelligent_Search_upsell_description')}
						</Callout>
					)}
					{hasIntelligentSearchLicense && !aiSearchFeatureEnabled && (
						<Callout type='warning' icon='warning' title={t('AI_Search_feature_disabled_title')} marginBlockEnd={16}>
							{t('AI_Search_feature_disabled_description')}
						</Callout>
					)}
					{canUseAISearch && !intelligentSearchEnabled && (
						<Callout type='warning' icon='warning' title={t('Intelligent_Search_disabled_title')} marginBlockEnd={16}>
							{t('Intelligent_Search_disabled_description')}
						</Callout>
					)}
					{canUseAISearch && intelligentSearchEnabled && meta && !meta.intelligentSearchConfigured && (
						<Callout type='warning' icon='warning' title={t('Intelligent_Search_missing_configuration_title')} marginBlockEnd={16}>
							{t('Intelligent_Search_missing_configuration_description')}
						</Callout>
					)}
					{searchError && (
						<Callout type='danger' icon='warning' marginBlockEnd={16}>
							{t('AI_Search_request_failed')}
						</Callout>
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
					{!debouncedQuery && (
						<Box display='flex' justifyContent='center' color='hint' padding={24}>
							{t('Intelligent_Search_start_from_top_bar')}
						</Box>
					)}
					{isLoading && (
						<Box display='flex' justifyContent='center' color='hint' padding={24}>
							{t('Loading')}
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
