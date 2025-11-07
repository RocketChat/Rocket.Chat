import { States, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type ReportCardErrorStateProps = {
	onRetry?: () => void;
};

export const ReportCardErrorState = ({ onRetry }: ReportCardErrorStateProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<States width='100%' height='100%'>
			<StatesIcon name='circle-exclamation' />
			<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
			<StatesActions data-qa='CardErrorState'>
				<StatesAction onClick={onRetry}>{t('Retry')}</StatesAction>
			</StatesActions>
		</States>
	);
};
