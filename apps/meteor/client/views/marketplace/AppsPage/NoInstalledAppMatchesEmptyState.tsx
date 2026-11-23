import {
	States,
	StatesIcon,
	StatesTitle,
	StatesSubtitle,
	StatesSuggestion,
	StatesSuggestionText,
	StatesActions,
	StatesAction,
	Stack,
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type NoInstalledAppMatchesEmptyStateProps = {
	shouldShowSearchText: boolean;
	text: string;
	onButtonClick: () => void;
};

const NoInstalledAppMatchesEmptyState = ({ shouldShowSearchText, text, onButtonClick }: NoInstalledAppMatchesEmptyStateProps) => {
	const { t } = useTranslation();

	return (
		<Stack grow justify='center'>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t('No_installed_app_matches')}</StatesTitle>
				{shouldShowSearchText && (
					<StatesSubtitle>
						{t('No_app_matches_for')} <strong>&quot;{text}&quot;</strong>
					</StatesSubtitle>
				)}
				<StatesSuggestion>
					<StatesSuggestionText>{t('Try_searching_in_the_marketplace_instead')}</StatesSuggestionText>
				</StatesSuggestion>
				<StatesActions>
					<StatesAction onClick={onButtonClick}>{t('Search_on_marketplace')}</StatesAction>
				</StatesActions>
			</States>
		</Stack>
	);
};

export default NoInstalledAppMatchesEmptyState;
