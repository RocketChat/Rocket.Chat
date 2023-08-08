import {
	Box,
	States,
	StatesIcon,
	StatesSubtitle,
	StatesSuggestion,
	StatesSuggestionList,
	StatesSuggestionListItem,
	StatesSuggestionText,
	StatesTitle,
} from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

type NoMarketplaceOrInstalledAppMatchesEmptyStateProps = { shouldShowSearchText: boolean; text: string };

const NoMarketplaceOrInstalledAppMatchesEmptyState = ({
	shouldShowSearchText,
	text,
}: NoMarketplaceOrInstalledAppMatchesEmptyStateProps): ReactElement => {
	const t = useTranslation();

	return (
		<Box mbs={20}>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t('No_app_matches')}</StatesTitle>
				{shouldShowSearchText && (
					<StatesSubtitle>
						{t('No_marketplace_matches_for')}: <strong>"{text}"</strong>
					</StatesSubtitle>
				)}
				<StatesSuggestion>
					<StatesSuggestionText>{t('You_can_try_to')}:</StatesSuggestionText>
					<StatesSuggestionList>
						<StatesSuggestionListItem>{t('Search_by_category')}</StatesSuggestionListItem>
						<StatesSuggestionListItem>{t('Search_for_a_more_general_term')}</StatesSuggestionListItem>
						<StatesSuggestionListItem>{t('Search_for_a_more_specific_term')}</StatesSuggestionListItem>
						<StatesSuggestionListItem>{t('Check_if_the_spelling_is_correct')}</StatesSuggestionListItem>
					</StatesSuggestionList>
				</StatesSuggestion>
			</States>
		</Box>
	);
};

export default NoMarketplaceOrInstalledAppMatchesEmptyState;
