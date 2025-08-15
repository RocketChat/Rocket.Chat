import { States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type Props = {
	title?: string;
	onRetry?(): void;
};

const OutboundMessageWizardErrorState = ({ title, onRetry }: Props) => {
	const { t } = useTranslation();
	return (
		<States width='100%' height='100%'>
			<StatesIcon name='circle-exclamation' />
			<StatesTitle>{title ?? t('Something_went_wrong')}</StatesTitle>
			{onRetry ? (
				<StatesActions>
					<StatesAction onClick={onRetry}>{t('Retry')}</StatesAction>
				</StatesActions>
			) : null}
		</States>
	);
};

export default OutboundMessageWizardErrorState;
