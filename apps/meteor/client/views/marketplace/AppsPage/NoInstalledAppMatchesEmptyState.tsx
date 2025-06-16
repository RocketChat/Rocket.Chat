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
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type NoInstalledAppMatchesEmptyStateProps = {
	shouldShowSearchText: boolean;
	text: string;
	onButtonClick: () => void;
};

const NoInstalledAppMatchesEmptyState = ({
	shouldShowSearchText,
	text,
	onButtonClick,
}: NoInstalledAppMatchesEmptyStateProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<Box mbs={20}>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{t('No_installed_app_matches')}</StatesTitle>
				{shouldShowSearchText && (
					<StatesSubtitle>
						<span>
							{t('No_app_matches_for')} <strong>"{text}"</strong>
						</span>
					</StatesSubtitle>
				)}
				<StatesSuggestion>
					<StatesSuggestionText>{t('Try_searching_in_the_marketplace_instead')}</StatesSuggestionText>
				</StatesSuggestion>
				<StatesActions>
					<StatesAction onClick={onButtonClick}>{t('Search_on_marketplace')}</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default NoInstalledAppMatchesEmptyState;
