import {
	Box,
	States,
	StatesIcon,
	StatesTitle,
	StatesSubtitle,
	StatesSuggestion,
	StatesSuggestionText,
	StatesActions,
	StatesAction,
} from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

type NoInstalledAppMatchesEmptyStateprops = {
	searchText: string;
};

const NoInstalledAppMatchesEmptyState = ({ searchText }: NoInstalledAppMatchesEmptyStateprops) => {
	const { t } = useTranslation();

	const router = useRouter();

	const handleButtonClick = () => {
		router.navigate({
			name: 'marketplace',
			params: {
				context: 'explore',
				page: 'list',
			},
		});
	};

	return (
		<Box mbs={20}>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t('No_installed_app_matches')}</StatesTitle>
				{searchText && (
					<StatesSubtitle>
						<span>
							{t('No_app_matches_for')} <strong>"{searchText}"</strong>
						</span>
					</StatesSubtitle>
				)}
				<StatesSuggestion>
					<StatesSuggestionText>{t('Try_searching_in_the_marketplace_instead')}</StatesSuggestionText>
				</StatesSuggestion>
				<StatesActions>
					<StatesAction onClick={handleButtonClick}>{t('Search_on_marketplace')}</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default NoInstalledAppMatchesEmptyState;
