import {
	States,
	StatesIcon,
	StatesTitle,
	StatesSubtitle,
	StatesSuggestion,
	StatesSuggestionText,
	StatesActions,
	StatesAction,
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import AppsPageEmptyState from './layout/AppsPageEmptyState';

export type NoInstalledAppMatchesEmptyStateProps = {
	shouldShowSearchText: boolean;
	text: string;
	onButtonClick: () => void;
};

const NoInstalledAppMatchesEmptyState = ({ shouldShowSearchText, text, onButtonClick }: NoInstalledAppMatchesEmptyStateProps) => {
	const { t } = useTranslation();

	return (
		<AppsPageEmptyState offset='x20'>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t('No_installed_app_matches')}</StatesTitle>
				{shouldShowSearchText && (
					<StatesSubtitle>
						{t('No_app_matches_for')} <strong>"{text}"</strong>
					</StatesSubtitle>
				)}
				<StatesSuggestion>
					<StatesSuggestionText>{t('Try_searching_in_the_marketplace_instead')}</StatesSuggestionText>
				</StatesSuggestion>
				<StatesActions>
					<StatesAction onClick={onButtonClick}>{t('Search_on_marketplace')}</StatesAction>
				</StatesActions>
			</States>
		</AppsPageEmptyState>
	);
};

export default NoInstalledAppMatchesEmptyState;
